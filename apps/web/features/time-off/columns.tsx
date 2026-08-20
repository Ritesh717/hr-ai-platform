"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { LeaveRequest } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

const statusTone = { pending: "warning", approved: "success", rejected: "danger" } as const;
const typeLabel = { vacation: "Vacation", sick: "Sick", personal: "Personal" } as const;

export function getLeaveRequestColumns(): ColumnDef<LeaveRequest, unknown>[] {
  return [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => typeLabel[row.original.type],
    },
    {
      id: "dates",
      header: "Dates",
      cell: ({ row }) =>
        `${new Date(row.original.startDate).toLocaleDateString()} – ${new Date(row.original.endDate).toLocaleDateString()}`,
    },
    {
      accessorKey: "days",
      header: "Days",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={statusTone[row.original.status]}>{row.original.status}</Badge>,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => row.original.reason ?? "—",
    },
  ];
}
