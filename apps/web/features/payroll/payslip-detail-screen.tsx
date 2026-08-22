"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { PayCompositionBar } from "@/components/patterns/pay-composition-bar";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayslips, usePayrollSummary } from "@/features/payroll/hooks/use-payroll-data";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(Math.abs(amount));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  id: string;
}

export function PayslipDetailScreen({ id }: Props) {
  const { data: payslips, isLoading: payslipsLoading } = usePayslips();
  const { data: summary, isLoading: summaryLoading } = usePayrollSummary();

  const payslip = payslips?.find((p) => p.id === id);
  const isLoading = payslipsLoading || summaryLoading;

  const totalEarnings = summary
    ? summary.breakdown
        .filter((r) => !r.isDeduction && !r.isNet)
        .reduce((s, r) => s + r.amount, 0)
    : 0;

  const totalDeductions = summary
    ? summary.breakdown
        .filter((r) => r.isDeduction)
        .reduce((s, r) => s + r.amount, 0)
    : 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between gap-3">
          <Button intent="ghost" size="sm" asChild>
            <Link href="/payroll">
              <ArrowLeft className="mr-1.5 size-4" />
              Back to Payroll
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button intent="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" />
              Print
            </Button>
            <Button intent="secondary" size="sm">
              <Download className="mr-2 size-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Payslip header */}
        <Card className="flex flex-col gap-4 p-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : payslip ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <div>
                <p className="text-lg font-bold text-text">PeopleHR Ltd.</p>
                <p className="text-sm text-text-muted">Payslip for the period</p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}
                </p>
              </div>
              <div className="text-right text-sm text-text-muted">
                <p className="font-medium text-text">{payslip.month}</p>
                <p>Employee ID: EMP-001</p>
                <p>Issue date: {formatDate(payslip.periodEnd)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Payslip not found.</p>
          )}
        </Card>

        {/* PayCompositionBar */}
        {(isLoading || (payslip && summary)) && (
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-section-heading">Pay composition</h2>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-full rounded-full" />
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <Skeleton className="h-5 w-1/2 rounded-full" />
              </div>
            ) : payslip && summary ? (
              <PayCompositionBar
                gross={payslip.grossAmount}
                deductions={totalDeductions}
                net={payslip.netAmount}
                currency={payslip.currency}
              />
            ) : null}
          </Card>
        )}

        {/* Earnings table */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Earnings</h2>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : summary ? (
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="bg-bg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted first:rounded-tl-lg">
                    Description
                  </th>
                  <th className="bg-bg px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-muted last:rounded-tr-lg">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.breakdown
                  .filter((r) => !r.isDeduction && !r.isNet)
                  .map((row, i) => (
                    <tr key={i}>
                      <td className="border-b border-border px-3 py-2.5 text-text">{row.label}</td>
                      <td className="border-b border-border px-3 py-2.5 text-right tabular-nums text-text">
                        {formatCurrency(row.amount, "GBP")}
                      </td>
                    </tr>
                  ))}
                <tr>
                  <td className="px-3 py-2.5 font-semibold text-text">Total earnings</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-text">
                    {formatCurrency(totalEarnings, "GBP")}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : null}
        </Card>

        {/* Deductions table */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Deductions</h2>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : summary ? (
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="bg-bg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted first:rounded-tl-lg">
                    Description
                  </th>
                  <th className="bg-bg px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-muted last:rounded-tr-lg">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.breakdown
                  .filter((r) => r.isDeduction)
                  .map((row, i) => (
                    <tr key={i}>
                      <td className="border-b border-border px-3 py-2.5 text-text">{row.label}</td>
                      <td className="border-b border-border px-3 py-2.5 text-right tabular-nums text-danger">
                        −{formatCurrency(Math.abs(row.amount), "GBP")}
                      </td>
                    </tr>
                  ))}
                <tr>
                  <td className="px-3 py-2.5 font-semibold text-text">Total deductions</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-danger">
                    −{formatCurrency(Math.abs(totalDeductions), "GBP")}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : null}
        </Card>

        {/* Summary glass card */}
        {payslip && summary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] border border-border bg-bg p-4">
              <p className="text-xs text-text-muted">Total earnings</p>
              <p className="tabular-nums text-lg font-bold text-text">
                {formatCurrency(totalEarnings, payslip.currency)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 p-4">
              <p className="text-xs text-text-muted">Total deductions</p>
              <p className="tabular-nums text-lg font-bold text-danger">
                −{formatCurrency(Math.abs(totalDeductions), payslip.currency)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] border border-success/30 bg-success/10 p-4">
              <p className="text-xs text-text-muted">Net pay</p>
              <p className="tabular-nums text-lg font-bold text-success">
                {formatCurrency(payslip.netAmount, payslip.currency)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="payslip" variant="rail" />
      </div>
    </div>
  );
}
