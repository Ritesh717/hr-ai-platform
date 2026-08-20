"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCreateEmployee, useDepartments, useEmployees } from "@/features/employees/api";
import { getEmployeeColumns } from "@/features/employees/columns";
import { EmployeeCreateDialog } from "@/features/employees/employee-create-dialog";
import {
  defaultEmployeeFilters,
  EmployeeFilterBar,
  EmployeeGridCard,
  EmployeeMiniTile,
  filterEmployees,
} from "@/features/employees/employee-list";
import { NO_DEPARTMENT } from "@/features/employees/schema";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";
import { ListView, ViewModeToggle, type ListViewMode } from "@/components/patterns/list-view";

export function EmployeesDirectoryScreen() {
  const router = useRouter();
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: employees, isLoading, isError, refetch } = useEmployees();
  const { data: departments } = useDepartments();
  const createEmployee = useCreateEmployee();
  const [filters, setFilters] = useState(defaultEmployeeFilters);
  const [mode, setMode] = useState<ListViewMode>("list");
  const [creating, setCreating] = useState(false);

  const canCreate = currentUser?.permissions.has("employee.write") ?? false;

  const departmentsById = useMemo(
    () => Object.fromEntries((departments ?? []).map((department) => [department.id, department.name])),
    [departments],
  );

  const filtered = useMemo(
    () => filterEmployees(employees ?? [], filters, departmentsById),
    [employees, filters, departmentsById],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description={`${employees?.length ?? 0} people across the organization`}
        actions={canCreate ? <Button onClick={() => setCreating(true)}>New employee</Button> : undefined}
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <EmployeeFilterBar employees={employees ?? []} filters={filters} onChange={setFilters} />
            <ViewModeToggle value={mode} onChange={setMode} />
          </div>

          {isError ? (
            <ErrorState description="Couldn't load employees." onRetry={() => refetch()} />
          ) : (
            <ListView
              mode={mode}
              items={filtered}
              getKey={(employee) => employee.id}
              renderList={() => (
                <DataTable
                  columns={getEmployeeColumns(departmentsById)}
                  data={filtered}
                  loading={isLoading}
                  emptyTitle="No employees match your search"
                  onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
                  pageSize={8}
                />
              )}
              renderGridCard={(employee) => (
                <EmployeeGridCard employee={employee} onClick={() => router.push(`/employees/${employee.id}`)} />
              )}
              renderMiniTile={(employee) => (
                <EmployeeMiniTile employee={employee} onClick={() => router.push(`/employees/${employee.id}`)} />
              )}
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
