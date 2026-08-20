"use client";

import { useState } from "react";
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "@/features/roles/api";
import { getRoleColumns } from "@/features/roles/columns";
import { RoleFormDialog } from "@/features/roles/role-form-dialog";
import type { Role } from "@/lib/api/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";

export function RolesScreen() {
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: roles, isLoading, isError, refetch } = useRoles();
  const createRole = useCreateRole();
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const updateRole = useUpdateRole(editing?.id ?? "");
  const deleteRole = useDeleteRole();

  const canManage = currentUser?.permissions.has("rbac.manage") ?? false;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & permissions"
        description={`${roles?.length ?? 0} roles in this workspace`}
        actions={canManage ? <Button onClick={() => setEditing(null)}>New role</Button> : undefined}
      />

      <Card>
        <CardContent>
          {isError ? (
            <ErrorState description="Couldn't load roles." onRetry={() => refetch()} />
          ) : (
            <DataTable
              columns={getRoleColumns({
                canManage,
                onEdit: (role) => setEditing(role),
                onDelete: (role) => setDeleting(role),
              })}
              data={roles ?? []}
              loading={isLoading}
              emptyTitle="No roles yet"
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {editing !== undefined && (
        <RoleFormDialog
          key={editing?.id ?? "create"}
          role={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSubmit={async (input) => {
            if (editing) {
              await updateRole.mutateAsync(input);
              push({ title: "Role updated", tone: "success" });
            } else {
              await createRole.mutateAsync(input);
              push({ title: "Role created", tone: "success" });
            }
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This can't be undone. Roles still assigned to employees can't be deleted."
        intent="destructive"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteRole.mutateAsync(deleting.id);
            push({ title: "Role deleted", tone: "success" });
          } catch (error) {
            push({
              title: "Couldn't delete role",
              description: error instanceof Error ? error.message : undefined,
              tone: "error",
            });
          }
        }}
      />
    </div>
  );
}
