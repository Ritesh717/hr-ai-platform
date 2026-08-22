"use client";

import {
  CalendarClock,
  ClipboardCheck,
  LayoutGrid,
  List,
  Monitor,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { MemberStatus, TeamMember } from "@/lib/api/team";
import { useTeamData } from "@/features/team/hooks/use-team-data";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { AvailabilityTimeline } from "@/components/patterns/availability-timeline";
import { StatCard } from "@/components/patterns/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statusTone: Record<MemberStatus, "success" | "info" | "warning" | "neutral" | "danger"> = {
  "in-office":  "success",
  "remote":     "info",
  "on-leave":   "warning",
  "in-meeting": "neutral",
  "out":        "neutral",
};

const statusLabel: Record<MemberStatus, string> = {
  "in-office":  "In Office",
  "remote":     "Remote",
  "on-leave":   "On Leave",
  "in-meeting": "In Meeting",
  "out":        "Out",
};

function MemberCard({ member, canApprove }: { member: TeamMember; canApprove: boolean }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={member.name} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text">{member.name}</p>
          <p className="truncate text-xs text-text-muted">{member.role}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge tone={statusTone[member.status]}>{statusLabel[member.status]}</Badge>
        <span className="text-xs text-text-muted">{member.leaveDaysRemaining}d leave left</span>
      </div>
      {canApprove && member.status === "on-leave" && (
        <Button intent="secondary" size="sm" className="w-full">
          <ClipboardCheck className="mr-1.5 size-3.5" />
          Approve leave
        </Button>
      )}
    </Card>
  );
}

function MemberListRow({ member, canApprove }: { member: TeamMember; canApprove: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <Avatar name={member.name} size="sm" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{member.name}</p>
        <p className="truncate text-xs text-text-muted">{member.role}</p>
      </div>
      <Badge tone={statusTone[member.status]}>{statusLabel[member.status]}</Badge>
      <span className="hidden text-xs text-text-muted sm:block">{member.leaveDaysRemaining}d left</span>
      {canApprove && member.status === "on-leave" && (
        <Button intent="secondary" size="sm">
          <ClipboardCheck className="mr-1.5 size-3.5" />
          Approve
        </Button>
      )}
    </div>
  );
}

export function MyTeamScreen() {
  const { data: currentUser } = useCurrentUser();
  const { kpis, members, availability } = useTeamData();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const canApprove = currentUser?.permissions.has("leave.approve") ?? false;
  const isLoading = kpis.isLoading || members.isLoading || availability.isLoading;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : kpis.data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Users}          label="Headcount"        value={String(kpis.data.headcount)} />
            <StatCard icon={CalendarClock}  label="On Leave Today"   value={String(kpis.data.onLeaveToday)} />
            <StatCard icon={Monitor}        label="Remote Today"     value={String(kpis.data.onRemoteToday)} />
            <StatCard icon={ClipboardCheck} label="Upcoming Reviews" value={String(kpis.data.upcomingReviews)} />
          </div>
        ) : null}

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Today's Availability</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : members.data && availability.data ? (
            <AvailabilityTimeline members={members.data} availability={availability.data} />
          ) : null}
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-section-heading">Team Members</h2>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                  viewMode === "list" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text"
                }`}
                aria-label="List view"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : members.data ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {members.data.map((m) => <MemberCard key={m.id} member={m} canApprove={canApprove} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.data.map((m) => <MemberListRow key={m.id} member={m} canApprove={canApprove} />)}
              </div>
            )
          ) : null}
        </Card>
      </div>

      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="team" variant="rail" />
      </div>
    </div>
  );
}
