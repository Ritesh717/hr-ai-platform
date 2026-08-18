"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEmployee, useUpdateEmployee } from "@/features/employees/api";
import { employeeProfileFields, employeeProfileSchema } from "@/features/employees/schema";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/patterns/error-state";
import { Form } from "@/components/patterns/form";
import { ViewOnlyForm } from "@/components/patterns/view-only-form";

const statusTone = { active: "success", on_leave: "warning", terminated: "danger" } as const;
const statusLabel = { active: "Active", on_leave: "On leave", terminated: "Terminated" } as const;

export function EmployeeDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const push = useToast();
  const { data: employee, isLoading, isError, refetch } = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);
  const [editing, setEditing] = useState(false);

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee profile"
        actions={
          <>
            <Button intent="secondary" onClick={() => router.push("/employees")}>
              Back to directory
            </Button>
            {!editing && <Button onClick={() => setEditing(true)}>Edit profile</Button>}
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={employee.name} src={employee.avatarUrl} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-text">{employee.name}</h2>
                <Badge tone={statusTone[employee.status]}>{statusLabel[employee.status]}</Badge>
              </div>
              <p className="text-sm text-text-muted">
                {employee.jobTitle} · {employee.department}
              </p>
            </div>
          </div>

          {editing ? (
            <Form
              schema={employeeProfileSchema}
              fields={employeeProfileFields}
              defaultValues={{ ...employee, hireDate: new Date(employee.hireDate) }}
              onCancel={() => setEditing(false)}
              onSubmit={async (values) => {
                await updateEmployee.mutateAsync({
                  ...values,
                  hireDate: values.hireDate.toISOString(),
                });
                push({ title: "Profile updated", tone: "success" });
                setEditing(false);
              }}
            />
          ) : (
            <ViewOnlyForm
              fields={employeeProfileFields}
              values={{ ...employee, hireDate: new Date(employee.hireDate) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
