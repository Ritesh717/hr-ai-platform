import { apiFetch } from "./client";

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

export async function fetchJobs(): Promise<Job[]> {
  return apiFetch<Job[]>("/api/v1/jobs");
}

export async function fetchJobById(id: string): Promise<JobDetail | null> {
  try {
    const job = await apiFetch<JobDetail>(`/api/v1/jobs/${id}`);
    return { ...job, skillsMatch: job.skillsMatch ?? [] };
  } catch {
    return null;
  }
}
