import { PermissionCode } from '../../rbac/constants/permission-code.enum';

// The identity an agent tool executes on behalf of for one call. Shape mirrors
// common/auth/current-employee.ts's CurrentEmployee deliberately — tools authorize the same way
// controllers/services do (actorPermissions resolved fresh from the DB per request, never
// trusted from anywhere else). Wiring a real CurrentEmployee into this shape at the API boundary
// is issue #4 ("Authentication propagation into agent tool calls"); this story only defines the
// contract tools and the agent runtime will share once that lands.
export interface AgentToolContext {
  tenantId: string;
  actorId: string;
  actorPermissions: ReadonlySet<PermissionCode>;
}
