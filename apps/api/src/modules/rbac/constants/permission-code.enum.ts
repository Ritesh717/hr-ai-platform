// Fixed, code-defined vocabulary of permission codes. Tenants pick subsets when building roles.
// Never invent new codes at runtime — add a member here (and to the seed template, if relevant).
export enum PermissionCode {
  EMPLOYEE_READ = 'employee.read',
  EMPLOYEE_WRITE = 'employee.write',
  EMPLOYEE_DELETE = 'employee.delete',
  DEPARTMENT_READ = 'department.read',
  DEPARTMENT_WRITE = 'department.write',
  AUDIT_LOG_READ = 'audit_log.read',
  RBAC_MANAGE = 'rbac.manage',
  LEAVE_READ = 'leave.read',
  LEAVE_APPROVE = 'leave.approve',
  LEAVE_MANAGE = 'leave.manage',
}

export const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(PermissionCode);

export function isPermissionCode(value: string): value is PermissionCode {
  return (ALL_PERMISSION_CODES as string[]).includes(value);
}

// RoleName labels the 3 seed-time starter roles only — plays no role in runtime authorization,
// purely a bootstrap-time convenience.
export enum RoleName {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR_ADMIN = 'hr_admin',
}
