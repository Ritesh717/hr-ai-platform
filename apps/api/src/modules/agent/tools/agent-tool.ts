import { ToolSet } from 'ai';
import { z } from 'zod';
import { requirePermission } from '../../rbac/authorization';
import { PermissionCode } from '../../rbac/constants/permission-code.enum';
import { AgentToolContext } from './agent-tool-context';

// CLAUDE.md rule 3 / blueprint §23 ("Agent Tool Authorization"): "Every tool declares the
// permission it requires... The LLM should never decide whether a user is authorized. The
// authorization layer decides." AgentToolDefinition is the declaration; buildToolSet() below is
// the authorization layer — it enforces requiredPermission before a tool's handler ever runs, in
// exactly one place, so an individual tool author cannot forget the check (and the LLM never sees
// this decision at all — it only sees "tool not available" via the thrown AuthorizationError,
// same as any other tool failure).
//
// This mirrors Agent → Tool → Domain Service → Repository (CLAUDE.md rule 1): `handler` below is
// expected to call into a domain service (e.g. EmployeeService, LeaveService), never a
// repository or Mongoose model directly.
export interface AgentToolDefinition<INPUT = unknown, OUTPUT = unknown> {
  /** Tool name as exposed to the model — must be unique within a registry. */
  name: string;
  /** Sent to the model so it knows when/how to call this tool. */
  description: string;
  /** Zod schema the model's tool-call arguments are validated against. */
  inputSchema: z.ZodType<INPUT>;
  /** Permission the caller must hold — checked by buildToolSet(), never by the model. */
  requiredPermission: PermissionCode;
  /** Business logic — call a domain service, never a repository/DB client directly. */
  handler: (input: INPUT, context: AgentToolContext) => Promise<OUTPUT>;
}

// A registry holds tools with different INPUT/OUTPUT types side by side, which TypeScript's
// strict function-type variance won't let a plain AgentToolDefinition[] express (a
// AgentToolDefinition<SpecificInput, _> is not assignable to AgentToolDefinition<unknown, _>
// under strictFunctionTypes). AnyAgentToolDefinition is the deliberately type-erased form used
// only for storage in a registry array; defineAgentTool() below is the single sanctioned place
// that performs the erasure, so a tool author writes a fully-typed definition and never has to
// reach for `any` themselves.
export type AnyAgentToolDefinition = AgentToolDefinition<any, any>;

export function defineAgentTool<INPUT, OUTPUT>(def: AgentToolDefinition<INPUT, OUTPUT>): AnyAgentToolDefinition {
  return def as AnyAgentToolDefinition;
}

// Story #1 scaffold only: no concrete tool definitions exist yet (see
// tools/employee-agent.tools.ts's empty EMPLOYEE_AGENT_TOOLS). This function is exercised once
// issue #2/#3 populate that registry; for now it's covered by agent-tool.spec.ts with a
// throwaway definition to prove the authorization gate works before any real tool depends on it.
//
// Deliberately builds each ToolSet entry as a plain object rather than calling the AI SDK's
// `tool()` helper: `tool()` is a runtime no-op (see @ai-sdk/provider-utils's `tool(t) { return t;
// }`) whose only purpose is generic type inference from a *statically known* INPUT/OUTPUT.
// Assigning into (or calling `tool()` with) the deeply-nested `Tool` union type using the
// deliberately type-erased `AnyAgentToolDefinition` makes `tsc` hit "Type instantiation is
// excessively deep" (TS2589) — so this builds an untyped map and asserts the whole thing as
// `ToolSet` once at the end, instead of structurally checking each entry against `Tool` in the
// loop. The object shape matches `Tool` exactly; only the type-checking strategy differs.
export function buildToolSet(definitions: readonly AnyAgentToolDefinition[], context: AgentToolContext): ToolSet {
  const toolSet: Record<string, unknown> = {};
  for (const def of definitions) {
    toolSet[def.name] = {
      description: def.description,
      inputSchema: def.inputSchema,
      execute: async (input: unknown) => {
        requirePermission(context.actorPermissions, def.requiredPermission);
        return def.handler(input, context);
      },
    };
  }
  return toolSet as unknown as ToolSet;
}
