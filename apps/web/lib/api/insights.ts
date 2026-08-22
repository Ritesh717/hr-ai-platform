export type InsightContext =
  | "home"
  | "time"
  | "leave"
  | "payroll"
  | "payslip"
  | "team"
  | "org"
  | "directory"
  | "profile"
  | "careers"
  | "admin";

export interface InsightContent {
  summary: string;
  detail?: string;
  actions?: Array<{ label: string; href?: string; context?: string }>;
}

const MOCK_INSIGHTS: Record<InsightContext, InsightContent> = {
  home: {
    summary: "You have 3 pending tasks this week — 1 leave request awaiting approval and 2 unread HR notices.",
    detail: "Your team headcount is on track. No anomalies detected.",
    actions: [{ label: "View tasks", href: "/time-off" }],
  },
  time: {
    summary: "You have 14 annual leave days remaining. Industry average for your role is 8 days at this point in the year.",
    actions: [{ label: "Request leave", href: "/time-off" }],
  },
  leave: {
    summary: "2 leave requests are pending approval from your team. Average approval time is 1.2 days.",
    actions: [{ label: "Review requests", href: "/approvals" }],
  },
  payroll: {
    summary: "Next payroll run is in 8 days. No discrepancies detected in your department's data.",
    actions: [{ label: "View payslips", href: "/payslips" }],
  },
  payslip: {
    summary: "Your gross pay increased 4.2% compared to the same period last year, reflecting your recent promotion.",
  },
  team: {
    summary: "Team utilisation is at 87% this week. 2 team members have upcoming leave — plan coverage now.",
    actions: [{ label: "View calendar", href: "/my-team" }],
  },
  org: {
    summary: "Engineering headcount grew 12% this quarter. The Design team has the highest internal mobility score.",
  },
  directory: {
    summary: "12 employees joined in the last 30 days. 3 roles are currently open across your department.",
    actions: [{ label: "View openings", href: "/careers" }],
  },
  profile: {
    summary: "Your profile is 92% complete. Adding your emergency contact will complete it.",
    actions: [{ label: "Complete profile", href: "/profile" }],
  },
  careers: {
    summary: "3 internal roles match your skills and tenure. Internal hires are 2× more likely to be promoted within 12 months.",
    actions: [{ label: "Browse roles", href: "/careers" }],
  },
  admin: {
    summary: "5 employees have incomplete onboarding tasks. 2 RBAC policy changes are awaiting review.",
    actions: [{ label: "Review tasks", href: "/audit-log" }],
  },
};

export async function fetchInsight(context: InsightContext): Promise<InsightContent> {
  // In production this will call GET /api/v1/agent/insights?context=
  await new Promise((r) => setTimeout(r, 400)); // simulate latency
  const insight = MOCK_INSIGHTS[context];
  if (!insight) throw new Error(`No insight available for context: ${context}`);
  return insight;
}
