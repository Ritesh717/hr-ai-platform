"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { Role } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";

export function getRoleColumns(params: {
  canManage: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}): ColumnDef<Role, unknown>[] {
  const columns: ColumnDef<Role, unknown>[] = [
    {
      accessorKey: "name",
      header: "Role",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-text">{row.original.name}</p>
          {row.original.description && (
            <p className="text-xs text-text-muted">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <div className="flex max-w-md flex-wrap gap-1">
          {row.original.permissions.length === 0 ? (
            <span className="text-text-muted">—</span>
          ) : (
            row.original.permissions.map((code) => (
              <Badge key={code} tone="neutral">
                {code}
              </Badge>
            ))
          )}
        </div>
      ),
    },
  ];

  if (params.canManage) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Edit role" size="sm" onClick={() => params.onEdit(row.original)}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton label="Delete role" size="sm" onClick={() => params.onDelete(row.original)}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ),
    });
  }

  return columns;
}
