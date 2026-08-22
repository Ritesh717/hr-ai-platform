export interface SkillTag {
  id: string;
  label: string;
}

export interface TimelineEntry {
  id: string;
  role: string;
  department: string;
  startDate: string;
  endDate?: string; // omit for current role
  description: string;
}

export interface PerformanceSummary {
  cycle: string;
  rating: "Exceptional" | "Exceeds Expectations" | "Meets Expectations" | "Needs Improvement";
  achievements: string[];
  managerComment: string;
}

export interface ProfileData {
  bio: string;
  skills: SkillTag[];
  timeline: TimelineEntry[];
  performance: PerformanceSummary;
  phone?: string;
  location?: string;
}

export async function fetchProfileData(_employeeId: string): Promise<ProfileData> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    bio: "Full-stack engineer passionate about developer tooling and internal platforms. I thrive in cross-functional teams and enjoy mentoring junior engineers.",
    phone: "+44 7911 123456",
    location: "London, UK",
    skills: [
      { id: "ts", label: "TypeScript" },
      { id: "react", label: "React" },
      { id: "node", label: "Node.js" },
      { id: "postgres", label: "PostgreSQL" },
      { id: "docker", label: "Docker" },
      { id: "k8s", label: "Kubernetes" },
      { id: "graphql", label: "GraphQL" },
      { id: "agile", label: "Agile" },
    ],
    timeline: [
      {
        id: "role-3",
        role: "Senior Software Engineer",
        department: "Platform Engineering",
        startDate: "2024-05",
        description: "Led the internal developer platform initiative and mentored 3 junior engineers.",
      },
      {
        id: "role-2",
        role: "Software Engineer",
        department: "Platform Engineering",
        startDate: "2022-07",
        endDate: "2024-04",
        description: "Built the CI/CD tooling pipeline and reduced deployment time by 40%.",
      },
      {
        id: "role-1",
        role: "Junior Software Engineer",
        department: "Backend Services",
        startDate: "2021-01",
        endDate: "2022-06",
        description: "Developed REST APIs and maintained the core billing microservice.",
      },
    ],
    performance: {
      cycle: "H1 2026",
      rating: "Exceeds Expectations",
      achievements: [
        "Delivered the HR AI platform frontend ahead of schedule",
        "Reduced build times by 35% with optimised bundle splitting",
        "Mentored 2 junior engineers through their probation period",
        "Led cross-team alignment on the new design system",
      ],
      managerComment:
        "Consistently delivers high-quality work and is a go-to resource for the team. Ready for a tech-lead role.",
    },
  };
}
