import { apiFetch } from "@/lib/api/client";
import type { Holiday, LeaveBalance, LeaveRequest, LeaveStatus, LeaveTeamEntry, LeaveType } from "@/lib/api/types";

// Backend serializes DTOs directly (camelCase) — see apps/api/src/modules/leave/dto/*.

export interface LeaveRequestCreateInput {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function fetchLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
  const query = employeeId ? `?employeeId=${employeeId}` : "";
  const res = await apiFetch<{ items: LeaveRequest[]; total: number }>(`/api/v1/leave/requests${query}`);
  return res.items;
}

export async function createLeaveRequest(input: LeaveRequestCreateInput): Promise<LeaveRequest> {
  return apiFetch<LeaveRequest>("/api/v1/leave/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateLeaveStatus(id: string, status: LeaveStatus, comment?: string): Promise<LeaveRequest> {
  return apiFetch<LeaveRequest>(`/api/v1/leave/requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, comment }),
  });
}

export interface LeaveRequestUpdateInput {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function updateLeaveRequest(id: string, input: LeaveRequestUpdateInput): Promise<LeaveRequest> {
  return apiFetch<LeaveRequest>(`/api/v1/leave/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function fetchLeaveBalance(employeeId?: string): Promise<LeaveBalance> {
  const query = employeeId ? `?employeeId=${employeeId}` : "";
  return apiFetch<LeaveBalance>(`/api/v1/leave/balance${query}`);
}

export async function fetchTeamLeave(statuses?: LeaveStatus[]): Promise<LeaveTeamEntry[]> {
  const query = statuses && statuses.length > 0 ? `?status=${statuses.join(",")}` : "";
  return apiFetch<LeaveTeamEntry[]>(`/api/v1/leave/team${query}`);
}

export async function fetchHolidays(): Promise<Holiday[]> {
  return apiFetch<Holiday[]>("/api/v1/leave/holidays");
}

export async function createHoliday(input: { name: string; date: string }): Promise<Holiday> {
  return apiFetch<Holiday>("/api/v1/leave/holidays", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteHoliday(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/leave/holidays/${id}`, { method: "DELETE" });
}
