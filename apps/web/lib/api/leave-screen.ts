export type LeaveScreenType = "Annual" | "Sick" | "Personal" | "Compensatory";
export type LeaveHistoryStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveScreenBalance {
  type: LeaveScreenType;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  tone: "primary" | "warning" | "success" | "info";
}

export interface LeaveHistoryEntry {
  id: string;
  type: LeaveScreenType;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: LeaveHistoryStatus;
  managerNote?: string;
}

export interface CoverageInfo {
  peopleOff: number;
  total: number;
  risk: "low" | "medium" | "high";
  message: string;
}

export interface ApprovalRisk {
  level: "low" | "medium" | "high";
  label: string;
  reason: string;
}

const PEAK_MD = [
  "12-24", "12-25", "12-26", "12-27", "12-28", "12-29", "12-30", "12-31",
  "01-01", "01-02",
];

function monthDay(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function fetchLeaveScreenBalances(_employeeId: string): Promise<LeaveScreenBalance[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [
    { type: "Annual",       totalDays: 20, usedDays: 8,  remainingDays: 12, tone: "primary" },
    { type: "Sick",         totalDays: 10, usedDays: 2,  remainingDays: 8,  tone: "warning" },
    { type: "Personal",     totalDays: 5,  usedDays: 1,  remainingDays: 4,  tone: "success" },
    { type: "Compensatory", totalDays: 3,  usedDays: 0,  remainingDays: 3,  tone: "info"    },
  ];
}

export async function fetchLeaveScreenHistory(_employeeId: string): Promise<LeaveHistoryEntry[]> {
  await new Promise((r) => setTimeout(r, 250));
  return [
    {
      id: "lv-01", type: "Annual",
      startDate: "2026-07-14", endDate: "2026-07-18", durationDays: 5,
      status: "Approved", managerNote: "Have a great holiday!",
    },
    {
      id: "lv-02", type: "Sick",
      startDate: "2026-06-03", endDate: "2026-06-04", durationDays: 2,
      status: "Approved",
    },
    {
      id: "lv-03", type: "Annual",
      startDate: "2026-08-25", endDate: "2026-08-29", durationDays: 5,
      status: "Pending",
    },
    {
      id: "lv-04", type: "Personal",
      startDate: "2026-05-15", endDate: "2026-05-15", durationDays: 1,
      status: "Rejected", managerNote: "Short notice — please re-submit with more lead time.",
    },
  ];
}

export async function fetchCoveragePreview(start: Date, _end: Date): Promise<CoverageInfo> {
  await new Promise((r) => setTimeout(r, 150));
  if (PEAK_MD.includes(monthDay(start))) {
    return { peopleOff: 3, total: 8, risk: "high", message: "3 people are already off — high conflict risk." };
  }
  const m = start.getMonth();
  if (m === 6 || m === 7) {
    return { peopleOff: 2, total: 8, risk: "medium", message: "2 people are off during this period." };
  }
  return { peopleOff: 0, total: 8, risk: "low", message: "No one else is off during this period." };
}

export async function fetchApprovalRisk(start: Date, _end: Date, _type: LeaveScreenType): Promise<ApprovalRisk> {
  await new Promise((r) => setTimeout(r, 100));
  if (PEAK_MD.includes(monthDay(start))) {
    return { level: "high",   label: "High risk",      reason: "Peak season — low coverage, high demand." };
  }
  const m = start.getMonth();
  if (m === 6 || m === 7) {
    return { level: "medium", label: "Medium risk",    reason: "Summer period — moderate demand." };
  }
  return { level: "low",    label: "Approval likely", reason: "Low conflict — good coverage during this period." };
}
