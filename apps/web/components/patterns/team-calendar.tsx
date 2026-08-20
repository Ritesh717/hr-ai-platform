"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export interface TeamCalendarEvent {
  requestId: string;
  /** "YYYY-MM-DD", as sliced straight from an ISO date string. */
  date: string;
  employeeName: string;
  status: "pending" | "approved";
  color: "warning" | "info";
  label: string;
}

const dotColor = { warning: "bg-warning", info: "bg-info" } as const;

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Double-sized sibling of MiniCalendar for a manager's team leave view — larger cells/dots/fonts
// and a per-day click handler opening a leave detail modal. Not a MiniCalendar variant since
// MiniCalendar's sizing is fully hardcoded with no size prop; the day-grid math is duplicated here
// rather than shared, since two call sites don't justify a generic abstraction yet.
export function TeamCalendar({
  events,
  onEventClick,
}: {
  events: TeamCalendarEvent[];
  onEventClick?: (requestId: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDate = new Map<string, TeamCalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = toDateKey(new Date());

  const cells: (Date | null)[] = Array.from({ length: startWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, monthIndex, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold text-text">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            intent="ghost"
            size="sm"
            className="w-9 px-0"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, monthIndex - 1, 1))}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            type="button"
            intent="ghost"
            size="sm"
            className="w-9 px-0"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, monthIndex + 1, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm text-text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 font-medium">
            {label}
          </div>
        ))}
        {cells.map((date, index) => {
          if (!date) return <div key={index} />;
          const key = toDateKey(date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const clickable = dayEvents.length > 0 && Boolean(onEventClick);
          return (
            <div
              key={key}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              title={dayEvents.map((event) => event.label).join(", ") || undefined}
              onClick={() => clickable && onEventClick?.(dayEvents[0].requestId)}
              onKeyDown={(event) => {
                if (clickable && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onEventClick?.(dayEvents[0].requestId);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-3 text-base font-medium text-text",
                key === today && "bg-primary/10 font-semibold text-primary",
                clickable && "cursor-pointer hover:bg-bg",
              )}
            >
              <span>{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <span key={i} className={cn("size-2.5 rounded-full", dotColor[event.color])} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
