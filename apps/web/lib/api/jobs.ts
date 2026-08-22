export type JobType = "Full-time" | "Contract" | "Remote" | "Part-time";
export type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Lead" | "Director";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  matchScore: number;
  postedAt: string;
  description: string;
}

export async function fetchJobs(): Promise<Job[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [
    {
      id: "j1",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "London, UK",
      type: "Full-time",
      experienceLevel: "Senior",
      matchScore: 94,
      postedAt: "2026-08-15",
      description: "Lead backend services in a high-scale distributed system.",
    },
    {
      id: "j2",
      title: "Staff Engineer — Platform",
      department: "Engineering",
      location: "Remote",
      type: "Remote",
      experienceLevel: "Lead",
      matchScore: 87,
      postedAt: "2026-08-18",
      description: "Own platform reliability and developer tooling across squads.",
    },
    {
      id: "j3",
      title: "Engineering Manager",
      department: "Engineering",
      location: "London, UK",
      type: "Full-time",
      experienceLevel: "Lead",
      matchScore: 81,
      postedAt: "2026-08-10",
      description: "Manage a team of 8 engineers working on core product features.",
    },
    {
      id: "j4",
      title: "Product Manager — Growth",
      department: "Product",
      location: "London, UK",
      type: "Full-time",
      experienceLevel: "Mid",
      matchScore: 72,
      postedAt: "2026-08-20",
      description: "Drive growth experiments and OKR delivery for the acquisition squad.",
    },
    {
      id: "j5",
      title: "Data Engineer",
      department: "Data",
      location: "Remote",
      type: "Remote",
      experienceLevel: "Mid",
      matchScore: 65,
      postedAt: "2026-08-17",
      description: "Build and maintain data pipelines powering analytics dashboards.",
    },
    {
      id: "j6",
      title: "UX Designer",
      department: "Design",
      location: "London, UK",
      type: "Full-time",
      experienceLevel: "Mid",
      matchScore: 48,
      postedAt: "2026-08-12",
      description: "Craft intuitive experiences for our HR platform products.",
    },
    {
      id: "j7",
      title: "Backend Engineer (Contract)",
      department: "Engineering",
      location: "Remote",
      type: "Contract",
      experienceLevel: "Senior",
      matchScore: 78,
      postedAt: "2026-08-21",
      description: "6-month contract to accelerate our API layer migration.",
    },
    {
      id: "j8",
      title: "HR Business Partner",
      department: "People",
      location: "London, UK",
      type: "Full-time",
      experienceLevel: "Mid",
      matchScore: 41,
      postedAt: "2026-08-08",
      description: "Support 3 business units with people strategies and HR advisory.",
    },
  ];
}
