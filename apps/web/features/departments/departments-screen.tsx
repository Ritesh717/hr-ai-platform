"use client";

import { useMemo, useState } from "react";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/features/departments/api";
import { getDepartmentColumns, type DepartmentRow } from "@/features/departments/columns";
import { DepartmentFormDialog } from "@/features/departments/department-form-dialog";
import { useEmployees } from "@/features/employees/api";
import type { Department } from "@/lib/api/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";

export function DepartmentsScreen() {
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: departments, isLoading, isError, refetch } = useDepartments();
  const { data: employees } = useEmployees();
  const createDepartment = useCreateDepartment();
  const [editing, setEditing] = useState<Department | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const updateDepartment = useUpdateDepartment(editing?.id ?? "");
  const deleteDepartment = useDeleteDepartment();

  const canManage = currentUser?.permissions.has("department.write") ?? false;

  const rows: DepartmentRow[] = useMemo(() => {
    if (!departments) return [];
    return departments.map((department) => ({
      ...department,
      headcount: (employees ?? []).filter((employee) => employee.departmentId === department.id).length,
    }));
  }, [departments, employees]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Departments"
        description={`${departments?.length ?? 0} departments`}
        actions={canManage ? <Button onClick={() => setEditing(null)}>New department</Button> : undefined}
      />

      <Card>
        <CardContent>
          {isError ? (
            <ErrorState description="Couldn't load departments." onRetry={() => refetch()} />
          ) : (
            <DataTable
              columns={getDepartmentColumns({
                canManage,
                onEdit: (department) => setEditing(department),
                onDelete: (department) => setDeleting(department),
              })}
              data={rows}
              loading={isLoading}
              emptyTitle="No departments yet"
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {editing !== undefined && (
        <DepartmentFormDialog
          key={editing?.id ?? "create"}
          department={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSubmit={async (name) => {
            if (editing) {
              await updateDepartment.mutateAsync(name);
              push({ title: "Department updated", tone: "success" });
            } else {
              await createDepartment.mutateAsync(name);
              push({ title: "Department created", tone: "success" });
            }
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="Employees in this department will be unassigned, not deleted."
        intent="destructive"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteDepartment.mutateAsync(deleting.id);
            push({ title: "Department deleted", tone: "success" });
          } catch (error) {
            push({
              title: "Couldn't delete department",
              description: error instanceof Error ? error.message : undefined,
              tone: "error",
            });
          }
        }}
      />
    </div>
  );
}
