"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/lib/api/audit-log";

export function useAuditLogs() {
  return useQuery({ queryKey: ["audit-logs"], queryFn: fetchAuditLogs });
}
