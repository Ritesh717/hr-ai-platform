"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export interface MiniCalendarEvent {
  /** "YYYY-MM-DD", as sliced straight from an ISO date string — see toDateKey. */
  date: string;
  color: "primary" | "warning" | "info" | "success";
  label: string;
}

const dotColor = {
  primary: "bg-primary",
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-success",
} as const;

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Days as a CSS grid, own+team leave and holidays shown as colored dots underneath the date —
// deliberately not a full calendar library (react-day-picker is already used for date *entry*
// elsewhere; this is a read-only month overview, a different job).
export function MiniCalendar({ events }: { events: MiniCalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDate = new Map<string, MiniCalendarEvent[]>();
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
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            intent="ghost"
            size="sm"
            className="w-8 px-0"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, monthIndex - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            intent="ghost"
            size="sm"
            className="w-8 px-0"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, monthIndex + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 font-medium">
            {label}
          </div>
        ))}
        {cells.map((date, index) => {
          if (!date) return <div key={index} />;
          const key = toDateKey(date);
          const dayEvents = eventsByDate.get(key) ?? [];
          return (
            <div
              key={key}
              title={dayEvents.map((event) => event.label).join(", ") || undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-text",
                key === today && "bg-primary/10 font-semibold text-primary",
              )}
            >
              <span>{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <span key={i} className={cn("size-1.5 rounded-full", dotColor[event.color])} />
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
