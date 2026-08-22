export type ApplicationStatus = "active" | "offer" | "rejected" | "withdrawn";

export const APPLICATION_STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Decision",
] as const;

export interface Application {
  id: string;
  jobTitle: string;
  department: string;
  appliedAt: string;
  updatedAt: string;
  currentStage: number;
  status: ApplicationStatus;
}

export async function fetchApplications(): Promise<Application[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [
    {
      id: "a1",
      jobTitle: "Senior Software Engineer",
      department: "Engineering",
      appliedAt: "2026-08-10",
      updatedAt: "2026-08-18",
      currentStage: 2,
      status: "active",
    },
    {
      id: "a2",
      jobTitle: "Staff Engineer — Platform",
      department: "Engineering",
      appliedAt: "2026-08-05",
      updatedAt: "2026-08-20",
      currentStage: 3,
      status: "offer",
    },
    {
      id: "a3",
      jobTitle: "Product Manager — Growth",
      department: "Product",
      appliedAt: "2026-07-28",
      updatedAt: "2026-08-12",
      currentStage: 1,
      status: "rejected",
    },
    {
      id: "a4",
      jobTitle: "Data Engineer",
      department: "Data",
      appliedAt: "2026-08-01",
      updatedAt: "2026-08-03",
      currentStage: 0,
      status: "withdrawn",
    },
  ];
}
