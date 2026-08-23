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
  | "leave.manage"
  | "expense.approve"
  | "expense.manage"
  | "payroll.manage"
  | "analytics.read"
  | "recruitment.manage";

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
  approverId: string | null;
  approverComment: string | null;
  respondedAt: string | null;
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
  status: LeaveStatus;
  reason: string | null;
  approverId: string | null;
  approverComment: string | null;
  respondedAt: string | null;
}

/** Mirrors apps/api/src/modules/leave/dto/holiday-response.dto.ts. */
export interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  date: string;
}

// --- Agent chat (components/chat/) ---
//
// Unlike the DTOs above, this isn't a direct mirror of a backend response — the chat surface
// keeps conversation history client-side (in memory only, blueprint §28) while
// apps/api/src/modules/agent/agent.controller.ts's `POST /api/v1/agent/employee/chat` is still a
// single-turn, non-streaming request/response contract (see AgentChatResponseDto). `ChatMessage`
// is the local view model the frontend renders; wiring it to the real endpoint (issue #67) means
// mapping each request/response pair into one user message + one assistant message here, and
// later widening `status` to cover token-by-token streaming without changing this shape.
export type ChatMessageRole = "user" | "assistant" | "system";

/** Lifecycle of a single message bubble — drives ChatComposer's disable/re-enable and typing indicator. */
export type ChatMessageStatus = "pending" | "complete" | "error";

/**
 * One trace entry for a tool the agent called while producing a reply — mirrors
 * AgentToolCallResponseDto (`name`, `input`) from apps/api's agent module. Rendered today as part
 * of ChatMessage's placeholder content; issue #66's ResponseRenderer replaces this with a proper
 * expandable ToolCallBlock.
 */
export interface ChatToolCallTrace {
  name: string;
  input: unknown;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  /** Plain text for now — content-block rendering is issue #66's ResponseRenderer, not this story. */
  content: string;
  createdAt: string; // ISO timestamp
  status?: ChatMessageStatus;
  toolCalls?: ChatToolCallTrace[];
  authorName?: string;
  avatarUrl?: string | null;
}
