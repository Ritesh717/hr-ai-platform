import 'reflect-metadata';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { EmployeeAgentService } from '../src/modules/agent/employee-agent.service';
import { AuthorizationError } from '../src/common/errors/app.error';
import { PermissionCode } from '../src/modules/rbac/constants/permission-code.enum';
import {
  closeTestApp,
  createDepartment,
  createTenantWithRoles,
  createTestApp,
  employeeUser,
  hrAdmin,
  manager,
  TestContext,
} from '../test/fixtures';

// Golden-dataset eval runner for the Employee Agent (blueprint §29/§30, agent-eval-case skill).
// Loads every case in tests/evaluation/employee-agent/cases/*.json, runs it through the *real*
// EmployeeAgentService (real tool-calling loop, real EmployeeService/DepartmentService, real
// in-memory Mongo fixture data — only the LLM call itself is against the live configured
// provider), and prints a pass/fail summary broken down by category.
//
// Deliberately NOT wired into `npm test`/CI: unlike the unit/e2e suites, this makes a real model
// API call per case (non-deterministic, costs money, needs a provider API key) — same reason
// bootstrap-tenant/seed-demo-org are standalone scripts, not test files. Run manually via
// `npm run eval:employee-agent` after any agent/prompt/tool/model change (blueprint §30: "Run
// this dataset after every agent/prompt/model change"). A fuller harness (assertion styles beyond
// substring/subset matching, historical run tracking, CI gating) is Stage 2 story #6's scope —
// this is the minimal runner the agent-eval-case skill asks a first case set to have.

interface EvalCase {
  id: string;
  category: string;
  question?: string;
  questionTemplate?: string;
  actor: 'employee' | 'manager' | 'hr_admin';
  actorPermissions?: PermissionCode[];
  requiresTargetEmployeeId?: boolean;
  expectedTool?: string;
  expectedToolArgs?: Record<string, unknown>;
  expectedToolArgsTemplate?: Record<string, unknown>;
  expectedOutcome?: 'tool_call_rejected';
  expectedRejection?: string;
  notes?: string;
}

interface CaseResult {
  id: string;
  category: string;
  pass: boolean;
  detail: string;
}

function loadCases(): EvalCase[] {
  const dir = join(__dirname, '..', 'tests', 'evaluation', 'employee-agent', 'cases');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as EvalCase);
}

function requiredApiKeyEnvVar(): string {
  const provider = process.env.AGENT_MODEL_PROVIDER ?? 'anthropic';
  return { anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', deepseek: 'DEEPSEEK_API_KEY' }[provider] ?? 'ANTHROPIC_API_KEY';
}

// A `null` in the eval case's expected args asserts "this key must be absent/undefined" rather
// than "this key's value must literally be null" — needed for tools like get_manager where
// omitting an optional arg (e.g. employeeId, to default to the caller's own record) is itself the
// behavior under test. Without this, `expectedToolArgs: {}` is vacuously true and wouldn't catch
// a regression where the model started supplying an id it shouldn't guess.
function argsSubsetMatch(actual: unknown, expected: Record<string, unknown>): boolean {
  if (typeof actual !== 'object' || actual === null) return false;
  const actualRecord = actual as Record<string, unknown>;
  return Object.entries(expected).every(([key, value]) =>
    value === null ? actualRecord[key] === undefined || actualRecord[key] === null : actualRecord[key] === value,
  );
}

async function runCase(ctx: TestContext, employeeAgentService: EmployeeAgentService, evalCase: EvalCase): Promise<CaseResult> {
  const { tenant, roles } = await createTenantWithRoles(ctx, { slug: `eval-${evalCase.id}` });
  const actorPermissions = new Set(evalCase.actorPermissions ?? []);
  const actorFixture = { employee: employeeUser, manager, hr_admin: hrAdmin }[evalCase.actor];
  const actor = await actorFixture(ctx, tenant, roles, { email: `actor-${evalCase.id}@example.com` });
  await createDepartment(ctx, tenant, 'Engineering');

  let targetEmployeeId: string | undefined;
  if (evalCase.requiresTargetEmployeeId) {
    const target = await employeeUser(ctx, tenant, roles, { email: `target-${evalCase.id}@example.com` });
    targetEmployeeId = target._id.toString();
  }

  const substitute = (value: string): string =>
    targetEmployeeId ? value.replace('{{targetEmployeeId}}', targetEmployeeId) : value;
  const question = evalCase.question ?? (evalCase.questionTemplate ? substitute(evalCase.questionTemplate) : '');
  const expectedToolArgs = evalCase.expectedToolArgs ?? (evalCase.expectedToolArgsTemplate
    ? Object.fromEntries(
        Object.entries(evalCase.expectedToolArgsTemplate).map(([k, v]) => [k, typeof v === 'string' ? substitute(v) : v]),
      )
    : undefined);

  try {
    const result = await employeeAgentService.chat({
      message: question,
      context: { tenantId: tenant._id.toString(), actorId: actor._id.toString(), actorPermissions },
    });

    if (evalCase.expectedOutcome === 'tool_call_rejected') {
      // Model didn't throw — check whether it still attempted the tool call and got a rejection,
      // or refused outright without calling the tool. Either is an acceptable safety outcome;
      // "called the tool AND used the data anyway" is the failure mode we're checking for. A
      // thrown tool error (e.g. AuthorizationError) surfaces as `call.error`, never `call.output`
      // — see EmployeeAgentToolCallSummary's doc comment — so `output !== undefined` is the
      // correct "did the tool actually hand back data" check.
      const call = result.toolCalls.find((c) => c.name === evalCase.expectedTool);
      const usedData = call && call.output !== undefined;
      return {
        id: evalCase.id,
        category: evalCase.category,
        pass: !usedData,
        detail: usedData
          ? `Tool call to '${evalCase.expectedTool}' appears to have returned data instead of being rejected: ${JSON.stringify(call?.output)}`
          : call
            ? `Tool call to '${evalCase.expectedTool}' was made and rejected as expected${call.error instanceof Error ? `: ${call.error.message}` : ''}.`
            : `Model refused without attempting the tool call — acceptable. Reply: ${result.reply}`,
      };
    }

    const call = result.toolCalls.find((c) => c.name === evalCase.expectedTool);
    if (!call) {
      return {
        id: evalCase.id,
        category: evalCase.category,
        pass: false,
        detail: `Expected tool '${evalCase.expectedTool}' was not called. Tools called: ${result.toolCalls.map((c) => c.name).join(', ') || '(none)'}`,
      };
    }
    if (expectedToolArgs && !argsSubsetMatch(call.input, expectedToolArgs)) {
      return {
        id: evalCase.id,
        category: evalCase.category,
        pass: false,
        detail: `Tool '${evalCase.expectedTool}' called with unexpected args: ${JSON.stringify(call.input)}, expected to include ${JSON.stringify(expectedToolArgs)}`,
      };
    }
    return { id: evalCase.id, category: evalCase.category, pass: true, detail: `Called '${evalCase.expectedTool}' with ${JSON.stringify(call.input)}.` };
  } catch (err) {
    if (evalCase.expectedOutcome === 'tool_call_rejected' && err instanceof AuthorizationError) {
      return { id: evalCase.id, category: evalCase.category, pass: true, detail: `Rejected with AuthorizationError as expected: ${err.message}` };
    }
    return { id: evalCase.id, category: evalCase.category, pass: false, detail: `Unexpected error: ${(err as Error).message}` };
  }
}

async function main() {
  const apiKeyVar = requiredApiKeyEnvVar();
  if (!process.env[apiKeyVar]) {
    console.log(`Skipping agent eval run: ${apiKeyVar} is not set. Set it (and optionally AGENT_MODEL_PROVIDER/AGENT_MODEL_NAME) to run this dataset against a real model.`);
    return;
  }

  const cases = loadCases();
  const ctx = await createTestApp();
  try {
    const employeeAgentService = ctx.app.get(EmployeeAgentService);
    const results: CaseResult[] = [];
    for (const evalCase of cases) {
      results.push(await runCase(ctx, employeeAgentService, evalCase));
    }

    console.log('\n--- Employee Agent eval results ---');
    for (const r of results) {
      console.log(`[${r.pass ? 'PASS' : 'FAIL'}] (${r.category}) ${r.id}: ${r.detail}`);
    }
    const byCategory = new Map<string, { pass: number; total: number }>();
    for (const r of results) {
      const entry = byCategory.get(r.category) ?? { pass: 0, total: 0 };
      entry.total += 1;
      if (r.pass) entry.pass += 1;
      byCategory.set(r.category, entry);
    }
    console.log('\n--- By category ---');
    for (const [category, { pass, total }] of byCategory) {
      console.log(`${category}: ${pass}/${total}`);
    }
    const failed = results.filter((r) => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} cases passed.`);
    process.exitCode = failed > 0 ? 1 : 0;
  } finally {
    await closeTestApp(ctx);
  }
}

main();
