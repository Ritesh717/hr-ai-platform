import { apiFetch } from "@/lib/api/client";
import type { Me } from "@/lib/api/types";

// Mirrors apps/api/src/modules/auth/dto/me-response.dto.ts.
export async function fetchMe(): Promise<Me> {
  return apiFetch<Me>("/api/v1/auth/me");
}
