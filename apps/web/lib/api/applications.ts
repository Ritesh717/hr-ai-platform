import { apiFetch } from "./client";

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
  return apiFetch<Application[]>("/api/v1/applications");
}

export async function applyToJob(jobId: string, payload: { coverNote?: string }): Promise<Application> {
  return apiFetch<Application>(`/api/v1/jobs/${jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function withdrawApplication(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/applications/${id}/withdraw`, { method: "PATCH" });
}
