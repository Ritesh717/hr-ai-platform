// Mirrors domain/rbac/constants.py's PermissionCode StrEnum — the fixed, code-defined
// vocabulary tenants pick subsets of when building roles. Never invent new codes at runtime;
// add a member here (and to the seed template below, if relevant) instead.
export enum PermissionCode {
  EMPLOYEE_READ = 'employee.read',
  EMPLOYEE_WRITE = 'employee.write',
  EMPLOYEE_DELETE = 'employee.delete',
  DEPARTMENT_READ = 'department.read',
  DEPARTMENT_WRITE = 'department.write',
  AUDIT_LOG_READ = 'audit_log.read',
  RBAC_MANAGE = 'rbac.manage',
}

export const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(PermissionCode);

export function isPermissionCode(value: string): value is PermissionCode {
  return (ALL_PERMISSION_CODES as string[]).includes(value);
}

// RoleName labels the 3 seed-time starter roles only — plays no role in runtime authorization,
// purely a bootstrap-time convenience (mirrors domain/rbac/constants.py's RoleName).
export enum RoleName {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR_ADMIN = 'hr_admin',
}
