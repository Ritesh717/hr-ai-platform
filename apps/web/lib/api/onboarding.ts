export type WorkflowStageStatus = "completed" | "in-progress" | "pending" | "blocked";

export interface WorkflowStage {
  id: string;
  label: string;
  description: string;
  status: WorkflowStageStatus;
  completedAt?: string;
  assignedTo?: string;
  estimatedDays?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  completed: boolean;
  dueDate?: string;
  assignedTo: "hr" | "manager" | "employee" | "it";
}

export interface OnboardingRecord {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  startDate: string;
  stages: WorkflowStage[];
  checklist: ChecklistItem[];
}

export async function fetchOnboardingRecords(): Promise<OnboardingRecord[]> {
  await new Promise((r) => setTimeout(r, 180));
  return [
    {
      id: "ob1",
      employeeName: "Sofia Andersson",
      role: "Product Manager",
      department: "Product",
      startDate: "2026-09-01",
      stages: [
        {
          id: "s1",
          label: "Offer & Contracts",
          description: "Signed offer letter, employment contract, and NDA",
          status: "completed",
          completedAt: "2026-08-10",
          assignedTo: "HR",
        },
        {
          id: "s2",
          label: "Account Provisioning",
          description: "Email, Slack, GitHub, Jira, and internal tools access",
          status: "in-progress",
          assignedTo: "IT",
          estimatedDays: 2,
        },
        {
          id: "s3",
          label: "Equipment Shipping",
          description: "Laptop, peripherals, and security key dispatched",
          status: "in-progress",
          assignedTo: "IT",
          estimatedDays: 3,
        },
        {
          id: "s4",
          label: "First-Day Orientation",
          description: "Welcome session, team introductions, and company tour",
          status: "pending",
          assignedTo: "HR",
          estimatedDays: 1,
        },
        {
          id: "s5",
          label: "30-Day Check-in",
          description: "Manager 1:1, feedback, and role alignment",
          status: "pending",
          assignedTo: "Manager",
        },
        {
          id: "s6",
          label: "Probation Review",
          description: "Formal review at end of probation period",
          status: "pending",
          assignedTo: "HR",
        },
      ],
      checklist: [
        { id: "c1",  label: "Send welcome email",            category: "Pre-arrival", completed: true,  dueDate: "2026-08-25", assignedTo: "hr" },
        { id: "c2",  label: "Create employee record in HRIS", category: "Pre-arrival", completed: true,  dueDate: "2026-08-20", assignedTo: "hr" },
        { id: "c3",  label: "Set up laptop and peripherals",  category: "IT Setup",    completed: true,  dueDate: "2026-08-28", assignedTo: "it" },
        { id: "c4",  label: "Provision email account",        category: "IT Setup",    completed: true,  dueDate: "2026-08-28", assignedTo: "it" },
        { id: "c5",  label: "Grant Slack & Jira access",      category: "IT Setup",    completed: false, dueDate: "2026-08-30", assignedTo: "it" },
        { id: "c6",  label: "Assign desk and office badge",   category: "Facilities",  completed: false, dueDate: "2026-09-01", assignedTo: "hr" },
        { id: "c7",  label: "Schedule team lunch",            category: "Culture",     completed: false, dueDate: "2026-09-01", assignedTo: "manager" },
        { id: "c8",  label: "Complete compliance training",   category: "Training",    completed: false, dueDate: "2026-09-07", assignedTo: "employee" },
        { id: "c9",  label: "Set 30-day goals with manager",  category: "Development", completed: false, dueDate: "2026-09-08", assignedTo: "manager" },
        { id: "c10", label: "Complete benefits enrolment",    category: "HR Admin",    completed: false, dueDate: "2026-09-05", assignedTo: "employee" },
      ],
    },
    {
      id: "ob2",
      employeeName: "Marcus Webb",
      role: "Backend Engineer",
      department: "Engineering",
      startDate: "2026-09-15",
      stages: [
        { id: "s1", label: "Offer & Contracts",      description: "Signed documentation", status: "completed", completedAt: "2026-08-18", assignedTo: "HR" },
        { id: "s2", label: "Account Provisioning",   description: "Tools and access",      status: "pending",   assignedTo: "IT", estimatedDays: 2 },
        { id: "s3", label: "Equipment Shipping",     description: "Hardware dispatch",     status: "pending",   assignedTo: "IT", estimatedDays: 3 },
        { id: "s4", label: "First-Day Orientation",  description: "Welcome session",       status: "pending",   assignedTo: "HR" },
        { id: "s5", label: "30-Day Check-in",        description: "Manager 1:1",           status: "pending",   assignedTo: "Manager" },
        { id: "s6", label: "Probation Review",       description: "Formal review",         status: "pending",   assignedTo: "HR" },
      ],
      checklist: [
        { id: "c1", label: "Send welcome email",            category: "Pre-arrival", completed: true,  dueDate: "2026-09-05", assignedTo: "hr" },
        { id: "c2", label: "Create employee record in HRIS", category: "Pre-arrival", completed: true,  dueDate: "2026-09-01", assignedTo: "hr" },
        { id: "c3", label: "Set up laptop and peripherals", category: "IT Setup",    completed: false, dueDate: "2026-09-12", assignedTo: "it" },
        { id: "c4", label: "Provision email account",       category: "IT Setup",    completed: false, dueDate: "2026-09-12", assignedTo: "it" },
        { id: "c5", label: "Grant Slack & Jira access",     category: "IT Setup",    completed: false, dueDate: "2026-09-12", assignedTo: "it" },
        { id: "c6", label: "Schedule team lunch",           category: "Culture",     completed: false, dueDate: "2026-09-15", assignedTo: "manager" },
        { id: "c7", label: "Complete compliance training",  category: "Training",    completed: false, dueDate: "2026-09-22", assignedTo: "employee" },
        { id: "c8", label: "Set 30-day goals with manager", category: "Development", completed: false, dueDate: "2026-09-22", assignedTo: "manager" },
      ],
    },
  ];
}
