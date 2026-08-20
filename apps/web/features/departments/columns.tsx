"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { Department } from "@/lib/api/types";
import { IconButton } from "@/components/ui/icon-button";

export interface DepartmentRow extends Department {
  headcount: number;
}

export function getDepartmentColumns(params: {
  canManage: boolean;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}): ColumnDef<DepartmentRow, unknown>[] {
  const columns: ColumnDef<DepartmentRow, unknown>[] = [
    { accessorKey: "name", header: "Department" },
    { accessorKey: "headcount", header: "Headcount" },
  ];

  if (params.canManage) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Rename department" size="sm" onClick={() => params.onEdit(row.original)}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton label="Delete department" size="sm" onClick={() => params.onDelete(row.original)}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ),
    });
  }

  return columns;
}
