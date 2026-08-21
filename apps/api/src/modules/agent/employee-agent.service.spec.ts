import { ConfigService } from '@nestjs/config';
import { MockLanguageModelV3 } from 'ai/test';
import { AppConfig } from '../../config/configuration';
import { DepartmentService } from '../department/department.service';
import { EmployeeService } from '../employee/employee.service';
import { LeaveService } from '../leave/leave.service';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { EmployeeAgentService } from './employee-agent.service';
import * as modelProvider from './model/agent-model.provider';
import { EmployeeAgentPromptService } from './prompt.service';

// This suite never calls a tool (the mock model always returns text, no tool calls), so
// EmployeeService/DepartmentService/LeaveService only need to satisfy the constructor's type —
// they're passed through unused to buildEmployeeAgentTools(). Real tool behavior is covered by
// tools/employee-agent.tools.spec.ts (mocked services) and test/agent-tools.e2e-spec.ts (real
// Mongo-backed services).
const fakeEmployeeService = {} as EmployeeService;
const fakeDepartmentService = {} as DepartmentService;
const fakeLeaveService = {} as LeaveService;

// Substitutes the real Anthropic/OpenAI client construction with the `ai` SDK's own test double
// (MockLanguageModelV3) so this proves the actual tool-calling loop — versioned prompt loading,
// generateText(), tool-set assembly, response shaping — works end to end without a network call
// or a real API key, i.e. exactly the "trivial no-tool round trip against the chosen model" the
// story's acceptance criteria asks for.
jest.spyOn(modelProvider, 'resolveAgentModel');

function fakeConfigService(overrides: Partial<AppConfig> = {}): ConfigService<AppConfig, true> {
  const values: Partial<AppConfig> = {
    agentModelProvider: 'anthropic',
    agentModelName: 'claude-3-5-haiku-20241022',
    agentPromptVersion: 'v1',
    anthropicApiKey: 'test-key',
    openaiApiKey: undefined,
    deepseekApiKey: undefined,
    ...overrides,
  };
  return { get: (key: keyof AppConfig) => values[key] } as unknown as ConfigService<AppConfig, true>;
}

describe('EmployeeAgentService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes a no-tool round trip: loads the versioned prompt, calls the model, returns a reply', async () => {
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: {
          inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 8, text: 8, reasoning: undefined },
        },
        content: [{ type: 'text' as const, text: 'You have no pending requests right now.' }],
        warnings: [],
      }),
    });
    jest.spyOn(modelProvider, 'resolveAgentModel').mockReturnValue(mockModel);

    const service = new EmployeeAgentService(
      fakeConfigService(),
      new EmployeeAgentPromptService(),
      fakeEmployeeService,
      fakeDepartmentService,
      fakeLeaveService,
    );

    const result = await service.chat({
      message: 'Do I have any pending requests?',
      context: {
        tenantId: 'tenant-1',
        actorId: 'employee-1',
        actorPermissions: new Set<PermissionCode>(),
      },
    });

    expect(result.reply).toBe('You have no pending requests right now.');
    expect(result.agentVersion).toBe(EmployeeAgentService.AGENT_VERSION);
    expect(result.promptVersion).toBe('v1');
    expect(result.modelProvider).toBe('anthropic');
    expect(result.modelName).toBe('claude-3-5-haiku-20241022');
    expect(result.toolCalls).toEqual([]);
  });

  it('records a thrown tool error (e.g. an authorization denial) in toolCalls instead of silently dropping it', async () => {
    // Regression test: step.toolResults (the `ai` SDK's own summary of successful tool calls)
    // only contains 'tool-result' content parts, not 'tool-error' ones — a thrown execute()
    // produces the latter. Before the fix, chat() matched against toolResults alone, so a denied
    // tool call showed up as `output: undefined`, indistinguishable from "no result yet" and
    // silently failing the "tool call + result appear in the trace" acceptance criterion for
    // exactly the safety-relevant case (an authorization denial).
    let callCount = 0;
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => {
        callCount += 1;
        if (callCount === 1) {
          return {
            finishReason: { unified: 'tool-calls' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call_1',
                toolName: 'get_department',
                input: JSON.stringify({ name: 'Engineering' }),
              },
            ],
            warnings: [],
          };
        }
        return {
          finishReason: { unified: 'stop' as const, raw: undefined },
          usage: {
            inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
            outputTokens: { total: 8, text: 8, reasoning: undefined },
          },
          content: [{ type: 'text' as const, text: "I'm not able to look up that department for you." }],
          warnings: [],
        };
      },
    });
    jest.spyOn(modelProvider, 'resolveAgentModel').mockReturnValue(mockModel);

    // get_department declares requiredPermission: DEPARTMENT_READ, enforced by buildToolSet()
    // before the handler (and therefore the real DepartmentService) ever runs — no need to mock
    // DepartmentService's behavior, only that it satisfies the constructor's type.
    const service = new EmployeeAgentService(
      fakeConfigService(),
      new EmployeeAgentPromptService(),
      fakeEmployeeService,
      fakeDepartmentService,
      fakeLeaveService,
    );

    const result = await service.chat({
      message: "What's the Engineering department's id?",
      context: {
        tenantId: 'tenant-1',
        actorId: 'employee-1',
        actorPermissions: new Set<PermissionCode>(), // no DEPARTMENT_READ
      },
    });

    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('get_department');
    expect(result.toolCalls[0].output).toBeUndefined();
    expect(result.toolCalls[0].error).toBeDefined();
  });

  it('propagates a missing-API-key failure from model resolution instead of masking it', async () => {
    jest.spyOn(modelProvider, 'resolveAgentModel').mockImplementation(() => {
      throw new Error("ANTHROPIC_API_KEY is required when AGENT_MODEL_PROVIDER='anthropic'");
    });

    const service = new EmployeeAgentService(
      fakeConfigService({ anthropicApiKey: undefined }),
      new EmployeeAgentPromptService(),
      fakeEmployeeService,
      fakeDepartmentService,
      fakeLeaveService,
    );

    await expect(
      service.chat({
        message: 'hi',
        context: { tenantId: 'tenant-1', actorId: 'employee-1', actorPermissions: new Set() },
      }),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
