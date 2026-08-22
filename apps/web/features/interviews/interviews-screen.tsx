"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Video, MapPin, Phone } from "lucide-react";
import { fetchInterviews } from "@/lib/api/interviews";
import type { Interview, InterviewFormat } from "@/lib/api/interviews";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORMAT_ICON: Record<InterviewFormat, React.ElementType> = {
  Video:      Video,
  "In-person": MapPin,
  Phone:      Phone,
};

const FORMAT_TONE: Record<InterviewFormat, "info" | "success" | "neutral"> = {
  Video:      "info",
  "In-person": "success",
  Phone:      "neutral",
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function generateIcs(interview: Interview): string {
  const start = new Date(interview.scheduledAt);
  const totalMin = interview.agenda.reduce((s, a) => s + a.durationMin, 0);
  const end = new Date(start.getTime() + totalMin * 60 * 1000);

  function icsDate(d: Date) {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hr-ai-platform//EN",
    "BEGIN:VEVENT",
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:Interview — ${interview.jobTitle}`,
    `DESCRIPTION:Format: ${interview.format}\\nPanel: ${interview.panelists.map((p) => p.name).join(", ")}`,
    `UID:${interview.id}@hr-ai-platform`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(interview: Interview) {
  const blob = new Blob([generateIcs(interview)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interview-${interview.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function InterviewDetailModal({
  interview,
  open,
  onClose,
  onCancel,
}: {
  interview: Interview;
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const { date, time } = fmtDateTime(interview.scheduledAt);
  const FmtIcon = FORMAT_ICON[interview.format];

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle className="text-base font-semibold">{interview.jobTitle}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>{date} at {time}</span>
            <Badge tone={FORMAT_TONE[interview.format]}>
              <FmtIcon className="size-3" />
              {interview.format}
            </Badge>
          </DialogDescription>

          {/* Panel members */}
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Panel</p>
            <div className="flex flex-col gap-2">
              {interview.panelists.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar name={p.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda */}
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Agenda</p>
            <ol className="flex flex-col gap-1">
              {interview.agenda.map((item, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                  <span className="text-text">{item.topic}</span>
                  <span className="text-xs text-text-muted">{item.durationMin} min</span>
                </li>
              ))}
            </ol>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button intent="secondary" size="sm" onClick={() => downloadIcs(interview)}>
              <CalendarPlus className="size-3.5" />
              Add to calendar
            </Button>
            <Button intent="ghost" size="sm" onClick={() => setCancelOpen(true)}>
              Cancel interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel interview?"
        description={`Are you sure you want to cancel your interview for ${interview.jobTitle}?`}
        confirmLabel="Cancel interview"
        intent="destructive"
        onConfirm={onCancel}
      />
    </>
  );
}

// ── Interview row card ────────────────────────────────────────────────────────

function InterviewCard({
  interview,
  onCancel,
}: {
  interview: Interview;
  onCancel: (id: string) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { date, time } = fmtDateTime(interview.scheduledAt);
  const FmtIcon = FORMAT_ICON[interview.format];

  return (
    <>
      <Card
        className="flex cursor-pointer flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
        onClick={() => setDetailOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-text">{interview.jobTitle}</p>
            <p className="text-xs text-text-muted">{interview.department}</p>
          </div>
          <AvatarGroup max={3}>
            {interview.panelists.map((p) => (
              <Avatar key={p.id} name={p.name} size="sm" />
            ))}
          </AvatarGroup>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span className="font-medium text-text">{date}</span>
          <span>at {time}</span>
          <Badge tone={FORMAT_TONE[interview.format]}>
            <FmtIcon className="size-3" />
            {interview.format}
          </Badge>
        </div>
      </Card>

      <InterviewDetailModal
        interview={interview}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onCancel={() => {
          setDetailOpen(false);
          onCancel(interview.id);
        }}
      />
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function InterviewsScreen() {
  const { data: initial = [], isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: fetchInterviews,
    staleTime: 5 * 60 * 1000,
  });

  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const interviews = initial.filter((i) => !cancelled.has(i.id));

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Interviews"
          description={`${interviews.length} upcoming interview${interviews.length !== 1 ? "s" : ""}`}
        />

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 py-16 text-center">
            <Video className="size-10 text-text-muted" />
            <p className="font-medium text-text">No upcoming interviews</p>
            <p className="text-sm text-text-muted">Apply to open roles to get started.</p>
            <Button asChild intent="secondary">
              <Link href="/jobs">Browse open roles</Link>
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                onCancel={(id) => setCancelled((prev) => new Set([...prev, id]))}
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
