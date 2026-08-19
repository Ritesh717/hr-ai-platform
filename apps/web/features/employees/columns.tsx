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

export function getEmployeeColumns(
  departmentsById: Record<string, string>,
): ColumnDef<Employee, unknown>[] {
  return [
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.fullName} size="sm" />
          <div>
            <p className="font-medium text-text">{row.original.fullName}</p>
            <p className="text-xs text-text-muted">{row.original.jobTitle}</p>
          </div>
        </div>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) =>
        row.original.departmentId ? (departmentsById[row.original.departmentId] ?? "—") : "—",
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => row.original.location ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge tone={statusTone[row.original.status]}>{statusLabel[row.original.status]}</Badge>
      ),
    },
  ];
}
