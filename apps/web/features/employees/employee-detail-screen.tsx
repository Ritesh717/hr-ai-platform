"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDeleteEmployee, useDepartments, useEmployee, useUpdateEmployee } from "@/features/employees/api";
import { NO_DEPARTMENT, employeeProfileSchema, getEmployeeProfileFields } from "@/features/employees/schema";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState } from "@/components/patterns/error-state";
import { Form } from "@/components/patterns/form";
import { ViewOnlyForm } from "@/components/patterns/view-only-form";

const statusTone = { active: "success", on_leave: "warning", terminated: "danger" } as const;
const statusLabel = { active: "Active", on_leave: "On leave", terminated: "Terminated" } as const;

export function EmployeeDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: employee, isLoading, isError, refetch } = useEmployee(id);
  const { data: departments } = useDepartments();
  const updateEmployee = useUpdateEmployee(id);
  const deleteEmployee = useDeleteEmployee();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = currentUser?.permissions.has("employee.delete") ?? false;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !employee) {
    return <ErrorState description="Couldn't load this employee." onRetry={() => refetch()} />;
  }

  const departmentName = employee.departmentId
    ? (departments ?? []).find((department) => department.id === employee.departmentId)?.name
    : null;

  const formValues = {
    fullName: employee.fullName,
    jobTitle: employee.jobTitle,
    departmentId: employee.departmentId ?? NO_DEPARTMENT,
    status: employee.status,
    location: employee.location ?? "",
    hireDate: new Date(employee.hireDate),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee profile"
        actions={
          <>
            <Button intent="secondary" onClick={() => router.push("/employees")}>
              Back to directory
            </Button>
            {canDelete && !editing && (
              <Button intent="destructive" onClick={() => setDeleting(true)}>
                Delete
              </Button>
            )}
            {!editing && <Button onClick={() => setEditing(true)}>Edit profile</Button>}
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={employee.fullName} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-text">{employee.fullName}</h2>
                <Badge tone={statusTone[employee.status]}>{statusLabel[employee.status]}</Badge>
              </div>
              <p className="text-sm text-text-muted">
                {employee.jobTitle}
                {departmentName ? ` · ${departmentName}` : ""} · {employee.role}
              </p>
              <p className="text-sm text-text-muted">{employee.email}</p>
            </div>
          </div>

          {editing ? (
            <Form
              schema={employeeProfileSchema}
              fields={getEmployeeProfileFields(departments ?? [])}
              defaultValues={formValues}
              onCancel={() => setEditing(false)}
              onSubmit={async (values) => {
                await updateEmployee.mutateAsync({
                  ...values,
                  departmentId: values.departmentId === NO_DEPARTMENT ? "" : values.departmentId,
                });
                push({ title: "Profile updated", tone: "success" });
                setEditing(false);
              }}
            />
          ) : (
            <ViewOnlyForm fields={getEmployeeProfileFields(departments ?? [])} values={formValues} />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${employee.fullName}?`}
        description="This can't be undone."
        intent="destructive"
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await deleteEmployee.mutateAsync(id);
            push({ title: "Employee deleted", tone: "success" });
            router.push("/employees");
          } catch (error) {
            push({
              title: "Couldn't delete employee",
              description: error instanceof Error ? error.message : undefined,
              tone: "error",
            });
          }
        }}
      />
    </div>
  );
}
