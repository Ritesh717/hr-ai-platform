import { PermissionCode, RoleName } from './permission-code.enum';

// Mirrors domain/rbac/constants.py's DEFAULT_ROLE_TEMPLATES. Consulted ONLY at tenant bootstrap
// time (RoleService.seedDefaultRoles) — never at request-authorization time. The base EMPLOYEE
// template deliberately omits EMPLOYEE_READ: the Employees Directory is HR-admin/manager-only,
// individual employees still see their own record via the actor-is-self bypass, not a grant.
export const DEFAULT_ROLE_TEMPLATES: Record<RoleName, PermissionCode[]> = {
  [RoleName.EMPLOYEE]: [PermissionCode.DEPARTMENT_READ, PermissionCode.LEAVE_READ],
  [RoleName.MANAGER]: [
    PermissionCode.EMPLOYEE_READ,
    PermissionCode.EMPLOYEE_WRITE,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.LEAVE_READ,
    PermissionCode.LEAVE_APPROVE,
  ],
  [RoleName.HR_ADMIN]: [
    PermissionCode.EMPLOYEE_READ,
    PermissionCode.EMPLOYEE_WRITE,
    PermissionCode.EMPLOYEE_DELETE,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.DEPARTMENT_WRITE,
    PermissionCode.AUDIT_LOG_READ,
    PermissionCode.RBAC_MANAGE,
    PermissionCode.LEAVE_READ,
    PermissionCode.LEAVE_APPROVE,
    PermissionCode.LEAVE_MANAGE,
  ],
};
