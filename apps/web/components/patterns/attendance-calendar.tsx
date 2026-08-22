"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { AttendanceDay, AttendanceStatus } from "@/lib/api/time";

const statusClass: Record<AttendanceStatus, string> = {
  present: "bg-success/15 text-success font-semibold",
  remote:  "bg-info/15 text-info font-semibold",
  leave:   "bg-warning/15 text-warning font-semibold",
  absent:  "bg-danger/10 text-danger",
  weekend: "text-text-subtle",
  holiday: "bg-primary/10 text-primary font-semibold",
};

const statusDot: Record<AttendanceStatus, string> = {
  present: "bg-success",
  remote:  "bg-info",
  leave:   "bg-warning",
  absent:  "bg-danger",
  weekend: "bg-transparent",
  holiday: "bg-primary",
};

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  /** Sorted ascending by date. */
  days: AttendanceDay[];
  /** Controlled month (1-indexed). If omitted, defaults to current month. */
  year?: number;
  month?: number;
  onMonthChange?: (year: number, month: number) => void;
}

export function AttendanceCalendar({ days, year: yearProp, month: monthProp, onMonthChange }: Props) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => {
    if (yearProp && monthProp) return new Date(yearProp, monthProp - 1, 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  function navigate(delta: number) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    setCursor(next);
    onMonthChange?.(next.getFullYear(), next.getMonth() + 1);
  }

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();

  const byDate = new Map<string, AttendanceDay>();
  for (const d of days) byDate.set(d.date, d);

  // Grid starts Monday
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0=Sun
  // Offset so Monday=0
  const offset = startWeekday === 0 ? 6 : startWeekday - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = toDateKey(now);

  const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text">
          {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <Button type="button" intent="ghost" size="sm" className="w-8 px-0" aria-label="Previous month"
            onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" intent="ghost" size="sm" className="w-8 px-0" aria-label="Next month"
            onClick={() => navigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 font-medium text-text-muted">{label}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toDateKey(date);
          const entry = byDate.get(key);
          const status = entry?.status ?? "absent";
          const isToday = key === today;
          return (
            <div
              key={key}
              title={entry ? `${status}${entry.hoursWorked ? ` · ${entry.hoursWorked}h` : ""}` : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-md py-1.5",
                statusClass[status],
                isToday && "ring-1 ring-primary ring-offset-1",
              )}
            >
              <span>{date.getDate()}</span>
              {status !== "weekend" && (
                <span className={cn("size-1.5 rounded-full", statusDot[status])} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-muted">
        {(["present", "remote", "leave", "absent"] as AttendanceStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", statusDot[s])} />
            <span className="capitalize">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
