import { PermissionCode } from '../../modules/rbac/constants/permission-code.enum';

// Resolved identity attached to req.user by JwtStrategy.validate().
// `permissions` is always computed fresh from the DB on this request, never trusted from the JWT payload.
export interface CurrentEmployee {
  employeeId: string;
  tenantId: string;
  roleId: string;
  roleName: string;
  permissions: Set<PermissionCode>;
}
