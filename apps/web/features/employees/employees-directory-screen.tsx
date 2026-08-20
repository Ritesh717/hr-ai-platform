"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCreateEmployee, useDepartments, useEmployees } from "@/features/employees/api";
import { getEmployeeColumns } from "@/features/employees/columns";
import { EmployeeCreateDialog } from "@/features/employees/employee-create-dialog";
import { NO_DEPARTMENT } from "@/features/employees/schema";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";

export function EmployeesDirectoryScreen() {
  const router = useRouter();
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: employees, isLoading, isError, refetch } = useEmployees();
  const { data: departments } = useDepartments();
  const createEmployee = useCreateEmployee();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreate = currentUser?.permissions.has("employee.write") ?? false;

  const departmentsById = useMemo(
    () => Object.fromEntries((departments ?? []).map((department) => [department.id, department.name])),
    [departments],
  );

  const filtered = useMemo(() => {
    if (!employees) return [];
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const departmentName = employee.departmentId ? departmentsById[employee.departmentId] : "";
      return (
        employee.fullName.toLowerCase().includes(query) ||
        (departmentName ?? "").toLowerCase().includes(query) ||
        employee.jobTitle.toLowerCase().includes(query)
      );
    });
  }, [employees, search, departmentsById]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description={`${employees?.length ?? 0} people across the organization`}
        actions={canCreate ? <Button onClick={() => setCreating(true)}>New employee</Button> : undefined}
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search by name, title, or department"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          {isError ? (
            <ErrorState description="Couldn't load employees." onRetry={() => refetch()} />
          ) : (
            <DataTable
              columns={getEmployeeColumns(departmentsById)}
              data={filtered}
              loading={isLoading}
              emptyTitle="No employees match your search"
              onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
              pageSize={8}
            />
          )}
        </CardContent>
      </Card>

      {creating && (
        <EmployeeCreateDialog
          departments={departments ?? []}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createEmployee.mutateAsync({
              fullName: values.fullName,
              email: values.email,
              password: values.password,
              jobTitle: values.jobTitle,
              roleId: values.roleId,
              departmentId: values.departmentId === NO_DEPARTMENT ? undefined : values.departmentId,
              hireDate: values.hireDate.toISOString().slice(0, 10),
              location: values.location || undefined,
            });
            push({ title: "Employee created", tone: "success" });
          }}
        />
      )}
    </div>
  );
}
