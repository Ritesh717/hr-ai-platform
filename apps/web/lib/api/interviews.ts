import { apiFetch } from "./client";

export type InterviewFormat = "Video" | "In-person" | "Phone";

export interface Panelist {
  id: string;
  name: string;
  role: string;
}

export interface AgendaItem {
  topic: string;
  durationMin: number;
}

export interface Interview {
  id: string;
  jobTitle: string;
  department: string;
  scheduledAt: string;
  format: InterviewFormat;
  panelists: Panelist[];
  agenda: AgendaItem[];
}

export async function fetchInterviews(): Promise<Interview[]> {
  return apiFetch<Interview[]>("/api/v1/interviews");
}

export async function cancelInterview(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/interviews/${id}/cancel`, { method: "PATCH" });
}
