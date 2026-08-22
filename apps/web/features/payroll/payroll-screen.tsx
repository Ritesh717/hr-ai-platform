"use client";

import {
  ArrowDownRight,
  Banknote,
  Download,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { usePayrollSummary, usePayslips } from "@/features/payroll/hooks/use-payroll-data";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number, currency: string, signed = false): string {
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  if (signed && amount < 0) return `−${formatted}`;
  return formatted;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function PayrollScreen() {
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = usePayrollSummary();
  const { data: payslips, isLoading: payslipsLoading } = usePayslips();

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Page heading */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Banknote className="size-5" />
          </div>
          <div>
            <h1 className="text-page-title">Payroll</h1>
            <p className="text-sm text-text-muted">Salary summary and payslip history</p>
          </div>
        </div>

        {/* Salary hero card */}
        <Card className="relative overflow-hidden p-6">
          {/* Subtle decorative gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
          />
          {summaryLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="mt-2 flex gap-8">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : summary ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                {/* Gross salary in text-financial style */}
                <p className="font-mono text-[2.25rem] font-bold tabular-nums leading-none tracking-tight text-text">
                  {formatCurrency(summary.grossSalary, summary.currency)}
                </p>
                <p className="text-sm text-text-muted">Annual gross salary</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-muted">
                  <span>
                    Next pay:{" "}
                    <span className="font-medium text-text">{formatDate(summary.nextPayDate)}</span>
                  </span>
                  <span>
                    YTD earnings:{" "}
                    <span className="font-medium text-text">
                      {formatCurrency(summary.ytdEarnings, summary.currency)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {summary.employmentType}
                </span>
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => router.push("/assistant?context=payroll")}
                >
                  <MessageCircle className="mr-2 size-4" />
                  Ask about your pay
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Pay breakdown */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Pay breakdown — this month</h2>
          {summaryLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : summary ? (
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                {summary.breakdown.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      row.isNet && "border-t-2 border-border font-semibold text-text",
                      !row.isNet && "text-text-muted",
                    )}
                  >
                    <td
                      className={cn(
                        "py-2.5",
                        row.isNet ? "text-sm font-semibold text-text" : "text-sm",
                        i !== 0 && "border-t border-border",
                      )}
                    >
                      {row.label}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 text-right tabular-nums",
                        row.isDeduction && "text-danger",
                        row.isNet && "text-base font-bold text-text",
                        i !== 0 && "border-t border-border",
                      )}
                    >
                      {row.isDeduction
                        ? formatCurrency(row.amount, summary.currency, true)
                        : formatCurrency(row.amount, summary.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Card>

        {/* Payslip history */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Payslip history</h2>
          {payslipsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : payslips && payslips.length > 0 ? (
            <div className="flex flex-col gap-2">
              {payslips.map((ps) => (
                <div
                  key={ps.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <Link
                    href={`/payroll/payslips/${ps.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 hover:underline"
                  >
                    <p className="text-sm font-medium text-text">{ps.month}</p>
                    <p className="text-xs text-text-muted">
                      {formatShortDate(ps.periodStart)} – {formatShortDate(ps.periodEnd)}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <p className="tabular-nums text-sm font-semibold text-text">
                      {formatCurrency(ps.grossAmount, ps.currency)}
                    </p>
                    <Badge tone={ps.status === "Paid" ? "success" : "warning"}>{ps.status}</Badge>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="w-8 px-0"
                      aria-label={`Download ${ps.month} payslip`}
                      title="Download payslip"
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No payslips available yet.</p>
          )}

          {/* Link to full payslip detail */}
          {payslips && payslips.length > 0 && (
            <div className="flex justify-end">
              <Button intent="ghost" size="sm" asChild>
                <Link href={`/payroll/payslips/${payslips[0].id}`}>
                  View latest payslip
                  <ArrowDownRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="payroll" variant="rail" />
      </div>
    </div>
  );
}
