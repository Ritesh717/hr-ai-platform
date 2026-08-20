"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuditLogs } from "@/features/audit-log/api";
import { getAuditLogColumns, type AuditLogRow } from "@/features/audit-log/columns";
import { useEmployees } from "@/features/employees/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";

export function AuditLogScreen() {
  const { data, isLoading, isError, refetch } = useAuditLogs();
  const { data: employees } = useEmployees();
  const [search, setSearch] = useState("");

  const employeeNameById = useMemo(
    () => Object.fromEntries((employees ?? []).map((employee) => [employee.id, employee.fullName])),
    [employees],
  );

  const rows: AuditLogRow[] = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((log) => ({
      ...log,
      actorName: log.actorEmployeeId ? (employeeNameById[log.actorEmployeeId] ?? "Unknown") : "System",
    }));
  }, [data, employeeNameById]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.action.toLowerCase().includes(query) ||
        row.resourceType.toLowerCase().includes(query) ||
        row.actorName.toLowerCase().includes(query),
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit log" description={`${data?.total ?? 0} events recorded`} />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Filter by actor, action, or resource"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          {isError ? (
            <ErrorState description="Couldn't load the audit log." onRetry={() => refetch()} />
          ) : (
            <DataTable
              columns={getAuditLogColumns()}
              data={filtered}
              loading={isLoading}
              emptyTitle="No activity matches your filter"
              pageSize={15}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
