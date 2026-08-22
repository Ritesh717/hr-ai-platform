"use client";

import { cn } from "@/lib/utils/cn";
import type { CareerRole } from "@/lib/api/careers";

function durationLabel(start: string | undefined, end?: string): string {
  if (!start) return "";
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (months < 12) return `${months}m`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}m` : `${y}y`;
}

function RoleNode({ role }: { role: CareerRole }) {
  const isPast = role.kind === "past";
  const isCurrent = role.kind === "current";
  const isProjected = role.kind === "projected";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 min-w-[130px] max-w-[150px]",
        isPast && "opacity-60",
      )}
    >
      {isProjected && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Projected
        </span>
      )}

      <div
        className={cn(
          "w-full rounded-xl border px-3 py-3 text-center transition-all",
          isCurrent
            ? "border-primary bg-primary/10 shadow-md"
            : isProjected
              ? "border-dashed border-border bg-surface/50"
              : "border-border bg-surface",
        )}
      >
        <p
          className={cn(
            "text-sm font-semibold leading-tight",
            isCurrent ? "text-primary" : "text-text",
          )}
        >
          {role.title}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">{role.department}</p>

        <div className="mt-2 text-[11px] text-text-muted">
          {isProjected ? (
            <span>~{role.estimatedMonths}m to reach</span>
          ) : isCurrent ? (
            <span>{durationLabel(role.startDate)} · current</span>
          ) : (
            <span>{durationLabel(role.startDate, role.endDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  roles: CareerRole[];
}

export function CareerJourneyCard({ roles }: Props) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative flex items-center gap-0 min-w-max px-2 pt-7">
        {/* Horizontal connector line */}
        <div className="absolute left-[75px] right-[75px] top-1/2 h-0.5 bg-border" />

        {roles.map((role, i) => {
          const isLast = i === roles.length - 1;
          return (
            <div key={role.id} className="flex items-center">
              <RoleNode role={role} />
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-8 shrink-0",
                    role.kind === "projected" ? "bg-border" : "bg-primary/40",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
