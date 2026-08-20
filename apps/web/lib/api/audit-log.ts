import { apiFetch } from "@/lib/api/client";
import type { AuditLog } from "@/lib/api/types";

// Backend serializes DTOs directly (camelCase) — see
// apps/api/src/modules/audit-log/dto/audit-log-response.dto.ts. No server-side filters exist
// beyond offset/limit — see plan.md's noted gap — so this fetches a page and the screen filters
// client-side.
interface AuditLogListResponseDto {
  items: AuditLog[];
  total: number;
}

export async function fetchAuditLogs(): Promise<{ items: AuditLog[]; total: number }> {
  return apiFetch<AuditLogListResponseDto>("/api/v1/audit-logs?limit=200");
}
