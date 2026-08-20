import { AnyAgentToolDefinition } from './agent-tool';

// Story #1 (Stage 2 agent runtime scaffold) deliberately ships this empty — per the issue's
// scope, tools land in issues #2 ("Employee & org read tools") and #3 ("Leave & payroll read
// tools"). Populate it with defineAgentTool({...}) entries as those land, e.g.:
//
//   export const EMPLOYEE_AGENT_TOOLS: AnyAgentToolDefinition[] = [
//     defineAgentTool({
//       name: 'get_employee_profile',
//       description: "Get the current employee's own profile.",
//       inputSchema: z.object({}),
//       requiredPermission: PermissionCode.EMPLOYEE_READ,
//       handler: async (_input, context) => employeeService.getEmployee(context.actorId, {
//         tenantId: context.tenantId,
//         actorId: context.actorId,
//         actorPermissions: context.actorPermissions,
//       }),
//     }),
//     ...
//   ];
//
// EmployeeAgentService reads this array through EmployeeAgentModule's provider wiring — no other
// module needs to know about it.
export const EMPLOYEE_AGENT_TOOLS: AnyAgentToolDefinition[] = [];
