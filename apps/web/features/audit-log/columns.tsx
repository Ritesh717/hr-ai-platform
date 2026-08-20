"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

export interface AuditLogRow extends AuditLog {
  actorName: string;
}

export function getAuditLogColumns(): ColumnDef<AuditLogRow, unknown>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "When",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    { accessorKey: "actorName", header: "Actor" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => <Badge tone="neutral">{row.original.action}</Badge>,
    },
    {
      id: "resource",
      header: "Resource",
      cell: ({ row }) => `${row.original.resourceType} · ${row.original.resourceId}`,
    },
  ];
}
