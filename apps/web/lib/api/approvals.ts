import { fetchEmployees } from "@/lib/api/employees";
import { fetchLeaveRequests, updateLeaveStatus } from "@/lib/api/leave";
import type { LeaveType } from "@/lib/api/types";

export type ApprovalType = "leave" | "expense" | "offboarding" | "role-change";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requesterName: string;
  requesterRole: string;
  summary: string;
  detail: string;
  submittedAt: string; // ISO
  urgency: "normal" | "high";
}

function leaveTypeLabel(t: LeaveType): string {
  if (t === "vacation") return "Annual";
  if (t === "sick") return "Sick";
  return "Personal";
}

export async function fetchApprovalRequests(): Promise<ApprovalRequest[]> {
  const [leaveRequests, employees] = await Promise.all([
    fetchLeaveRequests(),
    fetchEmployees(),
  ]);

  const empMap = new Map(employees.map((e) => [e.id, e]));

  return leaveRequests
    .filter((r) => r.status === "pending")
    .map((r) => {
      const emp = empMap.get(r.employeeId);
      const days = r.days;
      return {
        id: r.id,
        type: "leave" as ApprovalType,
        status: "pending" as ApprovalStatus,
        requesterName: emp?.fullName ?? "Unknown",
        requesterRole: emp?.jobTitle ?? "",
        summary: `${leaveTypeLabel(r.type)} leave · ${r.startDate} – ${r.endDate} (${days} day${days !== 1 ? "s" : ""})`,
        detail: r.reason ?? "",
        submittedAt: r.createdAt,
        urgency: r.type === "sick" && days <= 2 ? "high" : "normal",
      };
    });
}

export async function approveLeaveRequest(id: string): Promise<void> {
  await updateLeaveStatus(id, "approved");
}

export async function rejectLeaveRequest(id: string): Promise<void> {
  await updateLeaveStatus(id, "rejected");
}
