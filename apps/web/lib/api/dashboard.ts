export interface LeaveBalance {
  type: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface PayrollSummary {
  grossSalary: number;
  currency: string;
  nextPayDate: string;
  lastPayDate: string;
}

export interface HrTask {
  id: string;
  title: string;
  dueDate: string;
  kind: "policy" | "timesheet" | "document" | "other";
}

export interface CareerHighlight {
  currentRole: string;
  tenureLabel: string;
  aiSuggestion: string;
}

export interface DashboardData {
  greeting: string; // AI-personalized subtitle
  leaveBalances: LeaveBalance[];
  payroll: PayrollSummary;
  tasks: HrTask[];
  career: CareerHighlight;
}

export async function fetchDashboardData(_employeeId: string): Promise<DashboardData> {
  // In production: calls /api/v1/leave/balances, /api/v1/payroll/summary, etc. (Stage 4+)
  await new Promise((r) => setTimeout(r, 300));

  return {
    greeting: "You have 3 leave days remaining this month. Your next payslip lands Friday.",
    leaveBalances: [
      { type: "Annual", totalDays: 20, usedDays: 8, remainingDays: 12 },
      { type: "Sick", totalDays: 10, usedDays: 2, remainingDays: 8 },
      { type: "Personal", totalDays: 5, usedDays: 1, remainingDays: 4 },
    ],
    payroll: {
      grossSalary: 75_000,
      currency: "GBP",
      nextPayDate: "2026-08-29",
      lastPayDate: "2026-07-31",
    },
    tasks: [
      {
        id: "task-1",
        title: "Acknowledge Updated Data Privacy Policy",
        dueDate: "2026-08-25",
        kind: "policy",
      },
      {
        id: "task-2",
        title: "Submit August timesheet",
        dueDate: "2026-08-22",
        kind: "timesheet",
      },
    ],
    career: {
      currentRole: "Senior Software Engineer",
      tenureLabel: "2 years 4 months",
      aiSuggestion:
        "You're on track for a Lead Engineering role. 2 skill gaps identified — Cloud Architecture and System Design.",
    },
  };
}
