"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Info,
  Umbrella,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useApprovalRisk,
  useCoveragePreview,
  useLeaveScreenBalances,
  useLeaveScreenHistory,
} from "@/features/leave/hooks/use-leave-data";
import type { LeaveHistoryEntry, LeaveHistoryStatus, LeaveScreenType } from "@/lib/api/leave-screen";
import { createLeaveRequest } from "@/lib/api/leave";
import type { LeaveType } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { ProgressStat } from "@/components/patterns/progress-stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

// ── Schema ────────────────────────────────────────────────────────────────────

const leaveSchema = z
  .object({
    type: z.enum(["Annual", "Sick", "Personal", "Compensatory"] as const),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    reason: z.string().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must not be before start date",
    path: ["endDate"],
  });

type LeaveFormValues = z.infer<typeof leaveSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const toneColorText: Record<string, string> = {
  primary: "text-primary",
  warning:  "text-warning",
  success:  "text-success",
  info:     "text-info",
};

const statusTone: Record<LeaveHistoryStatus, "success" | "warning" | "danger" | "neutral"> = {
  Approved: "success",
  Pending:  "warning",
  Rejected: "danger",
};

const riskClass = {
  low:    "bg-success/10 border-success/30 text-success",
  medium: "bg-warning/10 border-warning/30 text-warning",
  high:   "bg-danger/10 border-danger/30 text-danger",
};

const riskIcon = {
  low:    CheckCircle2,
  medium: Info,
  high:   AlertTriangle,
};

// ── Leave history table ───────────────────────────────────────────────────────

function LeaveHistoryTable({ entries }: { entries: LeaveHistoryEntry[] }) {
  const [sortAsc, setSortAsc] = useState(false);
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => (sortAsc ? 1 : -1) * a.startDate.localeCompare(b.startDate),
      ),
    [entries, sortAsc],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {["Type", "Dates", "Days", "Status", "Note"].map((h) => (
              <th
                key={h}
                onClick={h === "Dates" ? () => setSortAsc((v) => !v) : undefined}
                className={cn(
                  "bg-bg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted",
                  "first:rounded-tl-lg last:rounded-tr-lg",
                  h === "Dates" && "cursor-pointer select-none hover:text-text",
                )}
              >
                {h}
                {h === "Dates" && (
                  <span className="ml-1 text-text-subtle">{sortAsc ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id}>
              <td className="border-b border-border px-3 py-2.5 font-medium text-text">{row.type}</td>
              <td className="border-b border-border px-3 py-2.5 text-text-muted">
                {formatDate(row.startDate)}
                {row.startDate !== row.endDate && ` – ${formatDate(row.endDate)}`}
              </td>
              <td className="border-b border-border px-3 py-2.5 text-text-muted">{row.durationDays}d</td>
              <td className="border-b border-border px-3 py-2.5">
                <Badge tone={statusTone[row.status]}>{row.status}</Badge>
              </td>
              <td className="border-b border-border px-3 py-2.5 text-xs text-text-subtle">
                {row.managerNote ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

function toApiLeaveType(t: LeaveScreenType): LeaveType {
  if (t === "Annual") return "vacation";
  if (t === "Sick") return "sick";
  return "personal";
}

export function LeaveScreen() {
  const push = useToast();
  const queryClient = useQueryClient();
  const { data: balances, isLoading: balancesLoading } = useLeaveScreenBalances();
  const { data: history, isLoading: historyLoading } = useLeaveScreenHistory();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({ resolver: zodResolver(leaveSchema) });

  const [startDate, endDate, leaveType] = watch(["startDate", "endDate", "type"]);

  const { data: coverage } = useCoveragePreview(startDate ?? null, endDate ?? null);
  const { data: riskData } = useApprovalRisk(
    startDate ?? null,
    endDate ?? null,
    (leaveType as LeaveScreenType) ?? null,
  );

  async function onSubmit(values: LeaveFormValues) {
    try {
      await createLeaveRequest({
        type: toApiLeaveType(values.type),
        startDate: values.startDate.toISOString().slice(0, 10),
        endDate: values.endDate.toISOString().slice(0, 10),
        reason: values.reason || undefined,
      });
      reset();
      void queryClient.invalidateQueries({ queryKey: ["leave-screen-history"] });
      push({ title: "Leave request submitted", description: "Your manager will review it shortly.", tone: "success" });
    } catch {
      push({ title: "Failed to submit leave request", description: "Please try again.", tone: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Page heading */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Umbrella className="size-5" />
          </div>
          <div>
            <h1 className="text-page-title">Leave</h1>
            <p className="text-sm text-text-muted">Request time off and view your leave history</p>
          </div>
        </div>

        {/* Balance cards */}
        <div>
          <h2 className="mb-3 text-section-heading">Leave balances</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {balancesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
                ))
              : balances?.map((b) => (
                  <Card key={b.type} className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-muted">{b.type}</span>
                      <span className={cn("text-lg font-bold", toneColorText[b.tone])}>
                        {b.remainingDays}
                        <span className="ml-0.5 text-[10px] text-text-subtle">d</span>
                      </span>
                    </div>
                    <ProgressStat
                      label=""
                      value=""
                      percentage={Math.round((b.remainingDays / b.totalDays) * 100)}
                      tone={b.tone}
                    />
                    <p className="text-[11px] text-text-subtle">{b.usedDays} used of {b.totalDays}</p>
                  </Card>
                ))}
          </div>
        </div>

        {/* Apply form */}
        <Card className="flex flex-col gap-5 p-5">
          <h2 className="text-section-heading">Apply for leave</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Leave type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-type">Leave type</Label>
              <Select onValueChange={(v) => setValue("type", v as LeaveScreenType, { shouldValidate: true })}>
                <SelectTrigger id="leave-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(["Annual", "Sick", "Personal", "Compensatory"] as LeaveScreenType[]).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-danger">{errors.type.message}</p>}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Start date</Label>
                <DatePicker
                  value={startDate ?? null}
                  onChange={(d) => setValue("startDate", d!, { shouldValidate: true })}
                  placeholder="From"
                />
                {errors.startDate && <p className="text-xs text-danger">{errors.startDate.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End date</Label>
                <DatePicker
                  value={endDate ?? null}
                  onChange={(d) => setValue("endDate", d!, { shouldValidate: true })}
                  placeholder="To"
                  disabled={startDate ? { before: startDate } : undefined}
                />
                {errors.endDate && <p className="text-xs text-danger">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Coverage preview */}
            {coverage && (
              <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", riskClass[coverage.risk])}>
                {(() => { const Icon = riskIcon[coverage.risk]; return <Icon className="mt-0.5 size-4 shrink-0" />; })()}
                <span>{coverage.message}</span>
              </div>
            )}

            {/* AI approval-risk badge */}
            {riskData && (
              <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", riskClass[riskData.level])}>
                {(() => { const Icon = riskIcon[riskData.level]; return <Icon className="mt-0.5 size-4 shrink-0" />; })()}
                <div>
                  <p className="font-semibold">{riskData.label}</p>
                  <p className="text-xs opacity-80">{riskData.reason}</p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">
                Reason <span className="text-text-subtle">(optional)</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Add a note for your manager..."
                rows={3}
                {...register("reason")}
              />
            </div>

            <Button type="submit" intent="primary" size="sm" className="self-start" disabled={isSubmitting}>
              <CalendarDays className="mr-2 size-4" />
              {isSubmitting ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </Card>

        {/* Leave history */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Leave history</h2>
          {historyLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : history && history.length > 0 ? (
            <LeaveHistoryTable entries={history} />
          ) : (
            <p className="text-sm text-text-muted">No leave requests yet.</p>
          )}
        </Card>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="leave" variant="rail" />
      </div>
    </div>
  );
}
