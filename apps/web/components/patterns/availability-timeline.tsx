"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import type { MemberAvailability, MemberStatus, TeamMember } from "@/lib/api/team";

const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const statusConfig: Record<MemberStatus, { bg: string; label: string }> = {
  "in-office":  { bg: "bg-success/70",  label: "In Office"  },
  "remote":     { bg: "bg-info/70",     label: "Remote"     },
  "on-leave":   { bg: "bg-warning/70",  label: "On Leave"   },
  "in-meeting": { bg: "bg-primary/70",  label: "In Meeting" },
  "out":        { bg: "bg-border",      label: "Out"        },
};

function pct(hour: number) {
  return ((hour - START_HOUR) / TOTAL_HOURS) * 100;
}

function currentHourPct(): number | null {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < START_HOUR || h > END_HOUR) return null;
  return pct(h);
}

interface TooltipState {
  label: string;
  x: number;
  y: number;
}

interface Props {
  members: TeamMember[];
  availability: MemberAvailability[];
}

export function AvailabilityTimeline({ members, availability }: Props) {
  const [nowPct, setNowPct] = useState<number | null>(currentHourPct);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNowPct(currentHourPct()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const availMap = new Map(availability.map((a) => [a.memberId, a]));

  function handleBlockEnter(e: React.MouseEvent, label: string) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ label, x: e.clientX - rect.left, y: e.clientY - rect.top - 32 });
  }

  function handleBlockLeave() {
    setTooltip(null);
  }

  return (
    <div ref={containerRef} className="relative select-none overflow-x-auto">
      <div className="mb-1 flex text-[10px] text-text-muted" style={{ paddingLeft: "8rem" }}>
        {hours.map((h) => (
          <div key={h} className="flex-1 text-center" style={{ minWidth: "2.5rem" }}>
            {h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {members.map((member) => {
          const avail = availMap.get(member.id);
          return (
            <div key={member.id} className="flex items-center">
              <div className="flex w-32 shrink-0 items-center gap-2 pr-2">
                <Avatar name={member.name} size="sm" className="shrink-0" />
                <span className="truncate text-xs font-medium text-text">{member.name.split(" ")[0]}</span>
              </div>
              <div className="relative h-7 flex-1 overflow-hidden rounded bg-chip" style={{ minWidth: "16rem" }}>
                {nowPct !== null && (
                  <div className="absolute inset-y-0 z-10 w-px bg-danger" style={{ left: `${nowPct}%` }} />
                )}
                {avail?.blocks.map((block, i) => {
                  const left = pct(block.startHour);
                  const width = pct(block.endHour) - left;
                  const cfg = statusConfig[block.status];
                  return (
                    <div
                      key={i}
                      className={cn("absolute inset-y-0.5 cursor-default rounded-sm transition-opacity hover:opacity-90", cfg.bg)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onMouseEnter={(e) => handleBlockEnter(e, block.label)}
                      onMouseLeave={handleBlockLeave}
                    />
                  );
                })}
                {hours.slice(1, -1).map((h) => (
                  <div key={h} className="absolute inset-y-0 w-px bg-border/50" style={{ left: `${pct(h)}%` }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text shadow-md"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.label}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {(Object.entries(statusConfig) as [MemberStatus, { bg: string; label: string }][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className={cn("size-2.5 rounded-sm", cfg.bg)} />
            {cfg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
