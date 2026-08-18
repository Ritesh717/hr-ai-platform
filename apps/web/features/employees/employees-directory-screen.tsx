"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useEmployees } from "@/features/employees/api";
import { employeeColumns } from "@/features/employees/columns";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";

export function EmployeesDirectoryScreen() {
  const router = useRouter();
  const { data: employees, isLoading, isError, refetch } = useEmployees();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!employees) return [];
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query) ||
        employee.jobTitle.toLowerCase().includes(query),
    );
  }, [employees, search]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Employees" description={`${employees?.length ?? 0} people across the organization`} />

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
              columns={employeeColumns}
              data={filtered}
              loading={isLoading}
              emptyTitle="No employees match your search"
              onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
              pageSize={8}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
