"use client";

import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { ProgressStat } from "@/components/patterns/progress-stat";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

const taskIconMap = {
  policy: ShieldAlert,
  timesheet: CalendarClock,
  document: FileText,
  other: CheckCircle2,
};

const leaveColors: Record<string, "success" | "warning" | "info" | "primary"> = {
  Annual: "success",
  Sick: "warning",
  Personal: "info",
};

export function EmployeeHomeScreen() {
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading } = useDashboardData();

  const firstName = currentUser?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Main content column ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Hero greeting */}
        <div className="flex flex-col gap-1">
          <h1 className="text-page-title">
            {greeting()}, {firstName}
          </h1>
          {isLoading ? (
            <Skeleton className="mt-1 h-4 w-2/3" />
          ) : (
            <p className="text-sm text-text-muted">{data?.greeting}</p>
          )}
        </div>

        {/* Leave balance tiles */}
        <div>
          <h2 className="mb-3 text-section-heading">Leave balances</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
                ))
              : data?.leaveBalances.map((balance) => (
                  <Card key={balance.type} className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-muted">{balance.type}</span>
                      <span className="text-lg font-semibold text-text">
                        {balance.remainingDays}
                        <span className="ml-1 text-xs text-text-subtle">days left</span>
                      </span>
                    </div>
                    <ProgressStat
                      label=""
                      value=""
                      percentage={Math.round((balance.remainingDays / balance.totalDays) * 100)}
                      tone={leaveColors[balance.type] ?? "primary"}
                    />
                  </Card>
                ))}
          </div>
        </div>

        {/* Payroll + Tasks */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Payroll summary */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </div>
              <h2 className="text-sm font-semibold text-text">Payroll</h2>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : data?.payroll ? (
              <>
                <div>
                  <p className="text-financial">
                    {formatCurrency(data.payroll.grossSalary, data.payroll.currency)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Annual gross salary</p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-text-muted">
                  <span>Next pay: {formatDate(data.payroll.nextPayDate)}</span>
                  <span>Last pay: {formatDate(data.payroll.lastPayDate)}</span>
                </div>
                <Button intent="secondary" size="sm" asChild className="self-start">
                  <Link href="/payroll">View payslips</Link>
                </Button>
              </>
            ) : null}
          </Card>

          {/* Tasks */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="size-4" />
              </div>
              <h2 className="text-sm font-semibold text-text">Open tasks</h2>
              {data && !isLoading && (
                <span className="ml-auto rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
                  {data.tasks.length}
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : data?.tasks.length === 0 ? (
              <p className="text-sm text-text-muted">All caught up!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data?.tasks.map((task) => {
                  const Icon = taskIconMap[task.kind];
                  return (
                    <div key={task.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <Icon className="mt-0.5 size-4 shrink-0 text-text-muted" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug text-text">{task.title}</p>
                        <p className="text-xs text-text-subtle">Due {formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Career highlight */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-text">Career</h2>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : data?.career ? (
            <>
              <div>
                <p className="font-semibold text-text">{data.career.currentRole}</p>
                <p className="text-xs text-text-muted">Tenure: {data.career.tenureLabel}</p>
              </div>
              <p className="text-sm text-text-muted">{data.career.aiSuggestion}</p>
              <Button intent="secondary" size="sm" asChild className="self-start">
                <Link href="/careers">Explore opportunities</Link>
              </Button>
            </>
          ) : null}
        </Card>
      </div>

      {/* ── AI insight rail (desktop right side) ─────────────── */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="home" variant="rail" />
      </div>
    </div>
  );
}
