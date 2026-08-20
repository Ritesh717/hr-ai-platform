import { z } from 'zod';
import { AuthorizationError } from '../../../common/errors/app.error';
import { PermissionCode } from '../../rbac/constants/permission-code.enum';
import { AnyAgentToolDefinition, buildToolSet, defineAgentTool } from './agent-tool';
import { AgentToolContext } from './agent-tool-context';

// Story #1 scaffold: no concrete tool exists yet (see tools/employee-agent.tools.ts), so this
// proves the authorization gate buildToolSet() enforces — every future real tool inherits this
// behavior for free by going through defineAgentTool()/buildToolSet() instead of hand-rolling
// its own ai-SDK tool() call.
describe('buildToolSet', () => {
  const context = (permissions: PermissionCode[]): AgentToolContext => ({
    tenantId: 'tenant-1',
    actorId: 'employee-1',
    actorPermissions: new Set(permissions),
  });

  function throwawayTool(handler = jest.fn().mockResolvedValue({ ok: true })): AnyAgentToolDefinition {
    return defineAgentTool({
      name: 'throwaway_tool',
      description: 'A test-only tool.',
      inputSchema: z.object({ value: z.string() }),
      requiredPermission: PermissionCode.EMPLOYEE_READ,
      handler,
    });
  }

  it('rejects a call when the caller lacks the declared permission — the LLM never decides this', async () => {
    const handler = jest.fn();
    const toolSet = buildToolSet([throwawayTool(handler)], context([]));

    await expect(
      // @ts-expect-error — ai SDK tool execute signature; second arg (ToolExecutionOptions) unused in this scaffold
      toolSet.throwaway_tool.execute!({ value: 'x' }, {}),
    ).rejects.toThrow(AuthorizationError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the handler with the validated input and context when authorized', async () => {
    const handler = jest.fn().mockResolvedValue({ ok: true });
    const ctx = context([PermissionCode.EMPLOYEE_READ]);
    const toolSet = buildToolSet([throwawayTool(handler)], ctx);

    // @ts-expect-error — see above
    const result = await toolSet.throwaway_tool.execute!({ value: 'x' }, {});

    expect(handler).toHaveBeenCalledWith({ value: 'x' }, ctx);
    expect(result).toEqual({ ok: true });
  });

  it('produces one entry per tool, keyed by name', () => {
    const toolSet = buildToolSet([throwawayTool()], context([PermissionCode.EMPLOYEE_READ]));
    expect(Object.keys(toolSet)).toEqual(['throwaway_tool']);
  });
});
