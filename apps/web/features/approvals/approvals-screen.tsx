"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCheck,
  UserMinus,
  UserRoundCog,
  X,
} from "lucide-react";
import { fetchApprovalRequests } from "@/lib/api/approvals";
import type { ApprovalRequest, ApprovalStatus, ApprovalType } from "@/lib/api/approvals";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Type config ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ApprovalType, { label: string; icon: React.ElementType; tone: "info" | "warning" | "danger" | "neutral" }> = {
  leave:       { label: "Leave",       icon: CalendarDays,   tone: "info" },
  expense:     { label: "Expense",     icon: BriefcaseBusiness, tone: "warning" },
  offboarding: { label: "Offboarding", icon: UserMinus,      tone: "danger" },
  "role-change":{ label: "Role change", icon: UserRoundCog,  tone: "neutral" },
};

// ── Local optimistic state ─────────────────────────────────────────────────────

type LocalDecision = "approved" | "rejected";

// ── Approval card ──────────────────────────────────────────────────────────────

function ApprovalRequestCard({
  request,
  isSelected,
  onToggle,
  onApprove,
  onReject,
}: {
  request: ApprovalRequest;
  isSelected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const cfg = TYPE_CONFIG[request.type];
  const Icon = cfg.icon;
  const submittedDate = new Date(request.submittedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          aria-label={`Select ${request.requesterName}'s request`}
          className="mt-0.5 shrink-0"
        />
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar name={request.requesterName} size="md" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-text">{request.requesterName}</p>
              <p className="text-xs text-text-muted">{request.requesterRole}</p>
            </div>
            <p className="mt-0.5 text-sm font-medium text-text">{request.summary}</p>
            <p className="mt-1 text-xs text-text-muted">{request.detail}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={cfg.tone}>
            <Icon className="mr-1 size-3" />
            {cfg.label}
          </Badge>
          {request.urgency === "high" && (
            <Badge tone="danger">
              <AlertCircle className="mr-1 size-3" />
              Urgent
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-xs text-text-muted">Submitted {submittedDate}</span>
        <div className="flex items-center gap-2">
          <Button intent="ghost" size="sm" onClick={onReject} className="text-danger hover:text-danger">
            <X className="mr-1 size-3.5" /> Reject
          </Button>
          <Button intent="secondary" size="sm" onClick={onApprove}>
            <Check className="mr-1 size-3.5" /> Approve
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DecidedCard({ request, decision }: { request: ApprovalRequest; decision: LocalDecision }) {
  const cfg = TYPE_CONFIG[request.type];
  const Icon = cfg.icon;
  return (
    <Card className="flex items-center gap-3 px-5 py-3 opacity-60">
      <Avatar name={request.requesterName} size="sm" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text">{request.requesterName}</p>
        <p className="text-xs text-text-muted">{request.summary}</p>
      </div>
      <Badge tone={cfg.tone}>
        <Icon className="mr-1 size-3" />
        {cfg.label}
      </Badge>
      <Badge tone={decision === "approved" ? "success" : "danger"}>
        {decision === "approved" ? "Approved" : "Rejected"}
      </Badge>
    </Card>
  );
}

// ── Bulk action bar ────────────────────────────────────────────────────────────

function BulkBar({
  count,
  onApproveAll,
  onRejectAll,
  onClear,
}: {
  count: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="shrink-0 text-sm font-medium text-text">{count} selected</span>
      <div className="flex flex-1 items-center gap-2">
        <Button intent="secondary" size="sm" onClick={onApproveAll}>
          <CheckCheck className="mr-1.5 size-3.5" /> Approve all
        </Button>
        <Button intent="ghost" size="sm" className="text-danger hover:text-danger" onClick={onRejectAll}>
          <X className="mr-1.5 size-3.5" /> Reject all
        </Button>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-md p-1 text-text-muted transition-colors hover:text-text"
        aria-label="Clear selection"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ApprovalsScreen() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: fetchApprovalRequests,
    staleTime: 2 * 60 * 1000,
  });

  const [decisions, setDecisions] = useState<Record<string, LocalDecision>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<ApprovalType | "all">("all");

  const pending = useMemo(
    () => (requests ?? []).filter((r) => !decisions[r.id]),
    [requests, decisions],
  );

  const decided = useMemo(
    () => (requests ?? []).filter((r) => decisions[r.id]),
    [requests, decisions],
  );

  const filtered = useMemo(() => {
    if (typeFilter === "all") return pending;
    return pending.filter((r) => r.type === typeFilter);
  }, [pending, typeFilter]);

  function decide(id: string, decision: LocalDecision) {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function bulkDecide(decision: LocalDecision) {
    selected.forEach((id) => decide(id, decision));
    setSelected(new Set());
  }

  const selectedPending = [...selected].filter((id) => !decisions[id]);

  const TYPE_TABS: { value: ApprovalType | "all"; label: string }[] = [
    { value: "all",        label: `All (${pending.length})` },
    { value: "leave",      label: "Leave" },
    { value: "expense",    label: "Expense" },
    { value: "offboarding",label: "Offboarding" },
    { value: "role-change",label: "Role change" },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Approvals"
          description={`${pending.length} pending request${pending.length !== 1 ? "s" : ""}`}
        />

        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ApprovalType | "all")}>
          <TabsList>
            {TYPE_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={typeFilter}>
            <div className="flex flex-col gap-3">
              {/* Bulk action bar */}
              <BulkBar
                count={selectedPending.length}
                onApproveAll={() => bulkDecide("approved")}
                onRejectAll={() => bulkDecide("rejected")}
                onClear={() => setSelected(new Set())}
              />

              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))
              ) : filtered.length === 0 ? (
                <Card className="py-12 text-center">
                  <p className="text-sm text-text-muted">No pending requests in this category.</p>
                </Card>
              ) : (
                filtered.map((request) => (
                  <ApprovalRequestCard
                    key={request.id}
                    request={request}
                    isSelected={selected.has(request.id)}
                    onToggle={() => toggleSelect(request.id)}
                    onApprove={() => decide(request.id, "approved")}
                    onReject={() => decide(request.id, "rejected")}
                  />
                ))
              )}

              {/* Decided items */}
              {decided.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Decided this session
                  </p>
                  {decided.map((r) => (
                    <DecidedCard key={r.id} request={r} decision={decisions[r.id]} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="leave" variant="rail" />
      </div>
    </div>
  );
}
