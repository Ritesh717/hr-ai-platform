/** Mirrors apps/api/src/modules/employee/dto/employee-response.dto.ts. */
export interface Employee {
  id: string;
  tenantId: string;
  departmentId: string | null;
  managerId: string | null;
  email: string;
  fullName: string;
  jobTitle: string;
  status: "active" | "on_leave" | "terminated";
  hireDate: string; // ISO date
  location: string | null;
  createdAt: string;
  updatedAt: string;
  roleId: string;
  role: string;
}

/** Mirrors apps/api/src/modules/department/dto/department-response.dto.ts. */
export interface Department {
  id: string;
  tenantId: string;
  name: string;
}

/**
 * Mirrors apps/api/src/modules/rbac/constants/permission-code.enum.ts. Extend as new domains
 * add permission codes server-side (see plan.md's batch order) — keep this in lockstep with the
 * backend enum rather than inventing codes ahead of it.
 */
export type PermissionCode =
  | "employee.read"
  | "employee.write"
  | "employee.delete"
  | "department.read"
  | "department.write"
  | "audit_log.read"
  | "rbac.manage"
  | "leave.read"
  | "leave.approve"
  | "leave.manage";

/** Mirrors apps/api/src/modules/auth/dto/me-response.dto.ts. */
export interface Me {
  employeeId: string;
  tenantId: string;
  roleId: string;
  roleName: string;
  permissions: PermissionCode[];
}

/** Mirrors apps/api/src/modules/rbac/dto/role-response.dto.ts. */
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  permissions: PermissionCode[];
}

/** Mirrors apps/api/src/modules/rbac/dto/permission-response.dto.ts. */
export interface Permission {
  code: PermissionCode;
  description: string | null;
}

/** Mirrors apps/api/src/modules/audit-log/dto/audit-log-response.dto.ts. */
export interface AuditLog {
  id: string;
  tenantId: string;
  actorEmployeeId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  extra: Record<string, unknown> | null;
  createdAt: string;
}

export type LeaveType = "vacation" | "sick" | "personal";
export type LeaveStatus = "pending" | "approved" | "rejected";

/** Mirrors apps/api/src/modules/leave/dto/leave-request-response.dto.ts. */
export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors apps/api/src/modules/leave/dto/leave-balance-response.dto.ts. */
export interface LeaveBalance {
  employeeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
}

/** Mirrors apps/api/src/modules/leave/dto/leave-team-entry.dto.ts. */
export interface LeaveTeamEntry {
  requestId: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
}

/** Mirrors apps/api/src/modules/leave/dto/holiday-response.dto.ts. */
export interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  date: string;
}
