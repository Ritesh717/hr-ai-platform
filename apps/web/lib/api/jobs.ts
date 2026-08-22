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

export interface SkillMatch {
  skill: string;
  matched: boolean;
  yourLevel: number;
  required: number;
}

export interface JobDetail extends Job {
  skillsMatch: SkillMatch[];
  sections: Array<{ heading: string; body: string }>;
}

const JOB_DETAILS: Record<string, Omit<JobDetail, keyof Job>> = {
  j1: {
    skillsMatch: [
      { skill: "TypeScript",    matched: true,  yourLevel: 88, required: 80 },
      { skill: "Node.js",       matched: true,  yourLevel: 85, required: 80 },
      { skill: "System Design", matched: false, yourLevel: 60, required: 90 },
      { skill: "AWS",           matched: false, yourLevel: 55, required: 80 },
      { skill: "PostgreSQL",    matched: true,  yourLevel: 78, required: 70 },
      { skill: "Leadership",    matched: true,  yourLevel: 70, required: 65 },
    ],
    sections: [
      { heading: "About the role", body: "You'll lead backend services for our core platform, shipping high-impact features and mentoring junior engineers across the team." },
      { heading: "Responsibilities", body: "• Design and implement scalable REST and GraphQL APIs\n• Own reliability, on-call rotation, and incident response\n• Mentor 2–3 mid-level engineers\n• Collaborate with Product and Design on technical roadmap" },
      { heading: "Requirements", body: "• 5+ years professional software engineering experience\n• Strong TypeScript/Node.js background\n• Experience designing distributed systems at scale\n• Familiarity with AWS (Lambda, RDS, SQS)" },
      { heading: "Nice to have", body: "• Experience with Temporal or durable workflow orchestration\n• Contribution to open-source projects\n• Prior experience in an HR-tech or fintech domain" },
    ],
  },
};

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

export async function fetchJobById(id: string): Promise<JobDetail | null> {
  const jobs = await fetchJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) return null;
  const detail = JOB_DETAILS[id];
  if (!detail) {
    return {
      ...job,
      skillsMatch: [],
      sections: [{ heading: "About the role", body: job.description }],
    };
  }
  return { ...job, ...detail };
}
