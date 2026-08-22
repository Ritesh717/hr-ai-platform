"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, ChevronDown, ChevronRight, Users } from "lucide-react";
import { fetchOnboardingRecords } from "@/lib/api/onboarding";
import type { ChecklistItem, OnboardingRecord } from "@/lib/api/onboarding";
import { WorkflowStatusTimeline } from "@/components/patterns/workflow-status-timeline";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

// ── Assignee config ───────────────────────────────────────────────────────────

const ASSIGNEE_TONE = {
  hr:       "info",
  manager:  "warning",
  employee: "success",
  it:       "neutral",
} as const;

const ASSIGNEE_LABEL = {
  hr:       "HR",
  manager:  "Manager",
  employee: "Employee",
  it:       "IT",
} as const;

// ── Checklist ─────────────────────────────────────────────────────────────────

function ChecklistSection({ items }: { items: ChecklistItem[] }) {
  const [localState, setLocalState] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.id, i.completed])),
  );

  const categories = [...new Set(items.map((i) => i.category))];
  const totalDone = Object.values(localState).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${(totalDone / items.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-text-muted">
          {totalDone}/{items.length} done
        </span>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return (
          <div key={cat} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{cat}</p>
            {catItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <Checkbox
                  checked={localState[item.id] ?? false}
                  onCheckedChange={(checked) =>
                    setLocalState((prev) => ({ ...prev, [item.id]: Boolean(checked) }))
                  }
                  aria-label={item.label}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={
                      localState[item.id]
                        ? "text-sm text-text-muted line-through"
                        : "text-sm text-text"
                    }
                  >
                    {item.label}
                  </p>
                  {item.dueDate && !localState[item.id] && (
                    <p className="text-xs text-text-muted">
                      Due{" "}
                      {new Date(item.dueDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
                <Badge tone={ASSIGNEE_TONE[item.assignedTo]}>
                  {ASSIGNEE_LABEL[item.assignedTo]}
                </Badge>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── New-hire card ─────────────────────────────────────────────────────────────

function NewHireCard({ record }: { record: OnboardingRecord }) {
  const [expanded, setExpanded] = useState(false);
  const completedStages = record.stages.filter((s) => s.status === "completed").length;
  const completedItems = record.checklist.filter((i) => i.completed).length;
  const startDate = new Date(record.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col">
      {/* Header */}
      <button
        type="button"
        className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-bg/50"
        onClick={() => setExpanded((v) => !v)}
      >
        <Avatar name={record.employeeName} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text">{record.employeeName}</p>
          <p className="text-xs text-text-muted">
            {record.role} · {record.department} · Starts {startDate}
          </p>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="text-xs text-text-muted">
            {completedStages}/{record.stages.length} stages
          </span>
          <span className="text-xs text-text-muted">
            {completedItems}/{record.checklist.length} tasks
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-text-muted" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-6 border-t border-border p-5 lg:grid-cols-2">
          {/* Workflow timeline */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-text">Workflow progress</h3>
            <WorkflowStatusTimeline stages={record.stages} />
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-text">Onboarding checklist</h3>
            <ChecklistSection items={record.checklist} />
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const { data: records, isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboardingRecords,
    staleTime: 5 * 60 * 1000,
  });

  const activeCount = records?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Onboarding"
          description={`${activeCount} active onboarding${activeCount !== 1 ? "s" : ""}`}
        />

        {/* Summary chips */}
        {!isLoading && records?.length ? (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <Users className="size-4 text-text-muted" />
              <span className="text-sm font-medium text-text">{records.length} new hires</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <CheckSquare className="size-4 text-success" />
              <span className="text-sm font-medium text-text">
                {records.reduce((sum, r) => sum + r.checklist.filter((i) => i.completed).length, 0)}{" "}
                / {records.reduce((sum, r) => sum + r.checklist.length, 0)} tasks complete
              </span>
            </div>
          </div>
        ) : null}

        {/* New-hire cards */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : records?.length === 0 ? (
            <Card className="py-12 text-center">
              <p className="text-sm text-text-muted">No active onboardings.</p>
            </Card>
          ) : (
            (records ?? []).map((record) => (
              <NewHireCard key={record.id} record={record} />
            ))
          )}
        </div>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="admin" variant="rail" />
      </div>
    </div>
  );
}
