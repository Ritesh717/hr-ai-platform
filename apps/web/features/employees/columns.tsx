"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Employee } from "@/lib/api/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const statusTone = {
  active: "success",
  on_leave: "warning",
  terminated: "danger",
} as const;

const statusLabel = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Terminated",
} as const;

export const employeeColumns: ColumnDef<Employee, unknown>[] = [
  {
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.name} src={row.original.avatarUrl} size="sm" />
        <div>
          <p className="font-medium text-text">{row.original.name}</p>
          <p className="text-xs text-text-muted">{row.original.jobTitle}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge tone={statusTone[row.original.status]}>{statusLabel[row.original.status]}</Badge>
    ),
  },
];
