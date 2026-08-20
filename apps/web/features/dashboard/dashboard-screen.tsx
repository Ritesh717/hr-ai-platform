"use client";

import { Building2, CalendarCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useAuditLogs } from "@/features/audit-log/api";
import { getEmployeeColumns } from "@/features/employees/columns";
import { useDepartments, useEmployees } from "@/features/employees/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ChartCard } from "@/components/patterns/chart-card";
import { DataTable } from "@/components/patterns/data-table";
import { HighlightCard } from "@/components/patterns/highlight-card";
import { ProgressStat } from "@/components/patterns/progress-stat";
import { StatCard } from "@/components/patterns/stat-card";

function humanizeAction(action: string): string {
  const [subject, verb] = action.split(".");
  if (!verb) return action;
  return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${verb}`;
}

const statusTone = { active: "success", on_leave: "warning", terminated: "info" } as const;

export function DashboardScreen() {
  const router = useRouter();
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const { data: auditLogs } = useAuditLogs();

  const onLeaveToday = employees?.filter((employee) => employee.status === "on_leave").length ?? 0;
  const departmentsById = Object.fromEntries(
    (departments ?? []).map((department) => [department.id, department.name]),
  );

  const headcountByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const employee of employees ?? []) {
      const label = employee.departmentId ? (departmentsById[employee.departmentId] ?? "Unknown") : "Unassigned";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([department, count]) => ({ department, count }));
  }, [employees, departmentsById]);

  const statusBreakdown = useMemo(() => {
    const total = employees?.length ?? 0;
    const counts = { active: 0, on_leave: 0, terminated: 0 };
    for (const employee of employees ?? []) counts[employee.status] += 1;
    return (Object.keys(counts) as (keyof typeof counts)[]).map((status) => ({
      status,
      count: counts[status],
      percentage: total > 0 ? Math.round((counts[status] / total) * 100) : 0,
    }));
  }, [employees]);

  const employeeNameById = useMemo(
    () => Object.fromEntries((employees ?? []).map((employee) => [employee.id, employee.fullName])),
    [employees],
  );
  const recentActivity = (auditLogs?.items ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening across the organization today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total employees" value={String(employees?.length ?? "—")} />
        <StatCard icon={CalendarCheck} label="On leave today" value={String(onLeaveToday)} />
        <StatCard icon={Building2} label="Departments" value={String(departments?.length ?? "—")} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Headcount by department" className="xl:col-span-2">
          <BarChart data={headcountByDepartment}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="department" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <HighlightCard title="Recent activity">
          <div className="flex flex-col gap-4">
            {recentActivity.length === 0 && <p className="text-sm text-text-muted">Nothing yet.</p>}
            {recentActivity.map((log) => {
              const actorName = log.actorEmployeeId ? (employeeNameById[log.actorEmployeeId] ?? "Someone") : "System";
              return (
                <div key={log.id} className="flex items-center gap-3">
                  <Avatar name={actorName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{humanizeAction(log.action)}</p>
                    <p className="truncate text-xs text-surface-raised-foreground/60">
                      {actorName} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </HighlightCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <Button intent="link" size="sm" onClick={() => router.push("/employees")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={getEmployeeColumns(departmentsById)}
              data={(employees ?? []).slice(0, 5)}
              loading={isLoading}
              onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workforce status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {statusBreakdown.map((item) => (
              <ProgressStat
                key={item.status}
                label={item.status.replace("_", " ")}
                value={String(item.count)}
                percentage={item.percentage}
                tone={statusTone[item.status]}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
