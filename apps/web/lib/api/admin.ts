export interface AdminKPI {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  sparkline: number[];
}

export interface PendingApproval {
  id: string;
  employee: string;
  type: string;
  submittedAt: string;
}

export interface NewHire {
  id: string;
  name: string;
  role: string;
  department: string;
  startDate: string;
}

export interface AdminDashboardData {
  kpis: AdminKPI[];
  pendingApprovals: PendingApproval[];
  newHires: NewHire[];
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    kpis: [
      {
        label: "Headcount",
        value: "1,247",
        delta: "+12 this month",
        deltaPositive: true,
        sparkline: [1180, 1195, 1198, 1205, 1210, 1215, 1220, 1225, 1230, 1235, 1240, 1247],
      },
      {
        label: "Attrition Rate",
        value: "3.2%",
        delta: "+2.1% vs last month",
        deltaPositive: false,
        sparkline: [1.8, 2.0, 2.2, 2.5, 2.4, 2.8, 3.0, 2.9, 3.1, 3.0, 3.2, 3.2],
      },
      {
        label: "Open Roles",
        value: "24",
        delta: "-3 filled this week",
        deltaPositive: true,
        sparkline: [31, 30, 29, 28, 29, 27, 26, 25, 27, 26, 25, 24],
      },
      {
        label: "Pending Approvals",
        value: "8",
        delta: "+3 new today",
        deltaPositive: false,
        sparkline: [2, 3, 5, 4, 6, 5, 7, 6, 8, 7, 8, 8],
      },
      {
        label: "Avg Time to Hire",
        value: "18d",
        delta: "-2d vs last quarter",
        deltaPositive: true,
        sparkline: [24, 23, 22, 22, 21, 21, 20, 20, 19, 19, 18, 18],
      },
    ],
    pendingApprovals: [
      { id: "a1", employee: "Clara Mendes",  type: "Annual Leave (5 days)",    submittedAt: "2 hours ago" },
      { id: "a2", employee: "Eva Sørensen",  type: "Remote Work Request",       submittedAt: "4 hours ago" },
      { id: "a3", employee: "David Kim",     type: "Expense Claim £820",        submittedAt: "Yesterday"   },
      { id: "a4", employee: "Frank Osei",    type: "Training Budget £1,200",    submittedAt: "Yesterday"   },
      { id: "a5", employee: "Grace Liu",     type: "Transfer Request",          submittedAt: "2 days ago"  },
    ],
    newHires: [
      { id: "n1", name: "Jordan Blake",  role: "Senior Engineer",   department: "Engineering", startDate: "Aug 19, 2026" },
      { id: "n2", name: "Priya Sharma",  role: "Product Manager",   department: "Product",     startDate: "Aug 18, 2026" },
      { id: "n3", name: "Leo Müller",    role: "Data Analyst",      department: "Finance",     startDate: "Aug 15, 2026" },
      { id: "n4", name: "Zoe Tanaka",    role: "UX Designer",       department: "Design",      startDate: "Aug 12, 2026" },
      { id: "n5", name: "Omar Rashid",   role: "DevOps Engineer",   department: "Engineering", startDate: "Aug 10, 2026" },
    ],
  };
}
