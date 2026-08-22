"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, Clock, ClipboardList, TrendingDown, Users } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { SparklineStatCard } from "@/components/patterns/sparkline-stat-card";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const KPI_ICONS: LucideIcon[] = [Users, TrendingDown, Briefcase, ClipboardList, Clock];

const QUICK_ACTIONS = [
  { label: "Add employee",               href: "/employees" },
  { label: "View pending approvals →",   href: "/approvals" },
  { label: "Run payroll →",             href: "/payroll"   },
  { label: "Export headcount report",    href: "/analytics" },
];

export function AdminDashboardScreen() {
  const { data: currentUser } = useCurrentUser();

  const canAccess =
    currentUser == null
      ? null
      : currentUser.permissions.has("employee.write") || currentUser.permissions.has("rbac.manage");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    staleTime: 5 * 60 * 1000,
    enabled: canAccess === true,
  });

  if (canAccess === false) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="font-semibold text-text">Access restricted</p>
        <p className="text-sm text-text-muted">
          You need HR Admin or RBAC permissions to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {data.kpis.map((kpi, i) => (
            <SparklineStatCard
              key={kpi.label}
              icon={KPI_ICONS[i]}
              label={kpi.label}
              value={kpi.value}
              delta={kpi.delta}
              deltaPositive={kpi.deltaPositive}
              sparklineData={kpi.sparkline}
            />
          ))}
        </div>
      ) : null}

      {/* AI org-health narrative */}
      <AIInsightPanel context="admin" variant="block" />

      {/* Quick-action shortcuts */}
      <div className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="rounded-full border border-glass-border bg-chip px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
          >
            {action.label}
          </Link>
        ))}
      </div>

      {/* At-a-glance tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data?.pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{item.employee}</p>
                      <p className="truncate text-xs text-text-muted">{item.type}</p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">{item.submittedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New hires this month */}
        <Card>
          <CardHeader>
            <CardTitle>New Hires This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data?.newHires.map((hire) => (
                  <div key={hire.id} className="flex items-center gap-3 py-3">
                    <Avatar name={hire.name} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{hire.name}</p>
                      <p className="truncate text-xs text-text-muted">
                        {hire.role} · {hire.department}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">{hire.startDate}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
