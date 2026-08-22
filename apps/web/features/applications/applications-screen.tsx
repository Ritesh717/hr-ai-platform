"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import {
  fetchApplications,
  APPLICATION_STAGES,
} from "@/lib/api/applications";
import type { Application, ApplicationStatus } from "@/lib/api/applications";
import { ApplicationStageTimeline } from "@/components/patterns/application-stage-timeline";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_TONE: Record<ApplicationStatus, "success" | "warning" | "neutral" | "danger" | "info"> = {
  active:    "info",
  offer:     "success",
  rejected:  "neutral",
  withdrawn: "neutral",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  active:    "Active",
  offer:     "Offer Received",
  rejected:  "Rejected",
  withdrawn: "Withdrawn",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ApplicationCard({
  app,
  onWithdraw,
}: {
  app: Application;
  onWithdraw: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canWithdraw = app.status === "active" || app.status === "offer";

  return (
    <>
      <Card className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-text">{app.jobTitle}</p>
            <p className="text-xs text-text-muted">{app.department}</p>
          </div>
          <Badge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Badge>
        </div>

        {/* Stage timeline */}
        <ApplicationStageTimeline
          stages={APPLICATION_STAGES}
          currentStage={app.currentStage}
          status={app.status}
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-xs text-text-muted">
            Applied {fmtDate(app.appliedAt)} · Updated {fmtDate(app.updatedAt)}
          </div>
          {canWithdraw && (
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Withdraw
            </Button>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Withdraw application?"
        description={`Are you sure you want to withdraw your application for ${app.jobTitle}? This action cannot be undone.`}
        confirmLabel="Withdraw"
        intent="destructive"
        onConfirm={() => onWithdraw(app.id)}
      />
    </>
  );
}

export function ApplicationsScreen() {
  const { data: initial, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
    staleTime: 5 * 60 * 1000,
  });

  const [withdrawn, setWithdrawn] = useState<Set<string>>(new Set());

  const apps = (initial ?? []).map((a) =>
    withdrawn.has(a.id) ? { ...a, status: "withdrawn" as ApplicationStatus } : a,
  );

  const activeCount = apps.filter((a) => a.status === "active" || a.status === "offer").length;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="My Applications"
          description={`${activeCount} active application${activeCount !== 1 ? "s" : ""}`}
        />

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 py-16 text-center">
            <Briefcase className="size-10 text-text-muted" />
            <p className="font-medium text-text">No applications yet</p>
            <p className="text-sm text-text-muted">Browse open roles to get started.</p>
            <Button asChild intent="secondary">
              <Link href="/jobs">Browse open roles</Link>
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {apps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onWithdraw={(id) => setWithdrawn((prev) => new Set([...prev, id]))}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="careers" variant="rail" />
      </div>
    </div>
  );
}
