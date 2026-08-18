"use client";

import { CalendarCheck, ClipboardList, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useEmployees } from "@/features/employees/api";
import { kpiTrend, upcomingApprovals, workingFormat } from "@/lib/mocks/dashboard";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ChartCard } from "@/components/patterns/chart-card";
import { DataTable } from "@/components/patterns/data-table";
import { HighlightCard } from "@/components/patterns/highlight-card";
import { ProgressStat } from "@/components/patterns/progress-stat";
import { StatCard } from "@/components/patterns/stat-card";
import { employeeColumns } from "@/features/employees/columns";

export function DashboardScreen() {
  const router = useRouter();
  const { data: employees, isLoading } = useEmployees();

  const onLeaveToday = employees?.filter((employee) => employee.status === "on_leave").length ?? 0;
  const avgPerformance = employees?.length
    ? Math.round(employees.reduce((sum, employee) => sum + employee.performanceScore, 0) / employees.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening across the organization today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total employees" value={String(employees?.length ?? "—")} delta={{ value: "4.1% vs last month", direction: "up" }} />
        <StatCard icon={CalendarCheck} label="On leave today" value={String(onLeaveToday)} />
        <StatCard icon={ClipboardList} label="Open approvals" value={String(upcomingApprovals.length)} />
        <StatCard icon={TrendingUp} label="Avg. performance" value={`${avgPerformance}%`} delta={{ value: "2.3% vs last quarter", direction: "up" }} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Average KPI score" className="xl:col-span-2">
          <AreaChart data={kpiTrend}>
            <defs>
              <linearGradient id="kpiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fill="url(#kpiFill)" />
          </AreaChart>
        </ChartCard>

        <HighlightCard title="Approvals needing attention">
          <div className="flex flex-col gap-4">
            {upcomingApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center gap-3">
                <Avatar name={approval.name} src={approval.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{approval.name}</p>
                  <p className="truncate text-xs text-surface-raised-foreground/60">{approval.detail}</p>
                </div>
              </div>
            ))}
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
              columns={employeeColumns}
              data={(employees ?? []).slice(0, 5)}
              loading={isLoading}
              onRowClick={(employee) => router.push(`/employees/${employee.id}`)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working format</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {workingFormat.map((item) => (
              <ProgressStat key={item.label} label={item.label} value={item.value} percentage={item.percentage} tone={item.tone} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
