"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { TimesheetRow, TimesheetWeek } from "@/lib/api/time";

function shortDate(isoMonday: string, offsetDays: number): string {
  const d = new Date(isoMonday);
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  week: TimesheetWeek;
  onSubmit?: (rows: TimesheetRow[]) => void;
}

export function TimesheetGrid({ week, onSubmit }: Props) {
  const [rows, setRows] = useState<TimesheetRow[]>(() =>
    week.rows.map((r) => ({ ...r, hours: [...r.hours] })),
  );
  const [submitted, setSubmitted] = useState(week.isSubmitted);

  function updateHours(rowIdx: number, dayIdx: number, value: string) {
    const parsed = Math.max(0, Math.min(24, parseFloat(value) || 0));
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === rowIdx ? { ...r, hours: r.hours.map((h, j) => (j === dayIdx ? parsed : h)) } : r,
      );
      return next;
    });
  }

  function colTotal(dayIdx: number): number {
    return rows.reduce((s, r) => s + r.hours[dayIdx], 0);
  }

  const grandTotal = rows.reduce((s, r) => s + r.hours.reduce((a, b) => a + b, 0), 0);

  function handleSubmit() {
    setSubmitted(true);
    onSubmit?.(rows);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-40 rounded-tl-lg bg-bg px-3 py-2 text-left font-semibold text-text-muted">
                Project
              </th>
              {DAY_LABELS.map((day, i) => (
                <th key={day} className="bg-bg px-2 py-2 text-center font-medium text-text-muted">
                  <div>{day}</div>
                  <div className="text-[10px] text-text-subtle">{shortDate(week.weekStart, i).split(" ")[1]}</div>
                </th>
              ))}
              <th className="rounded-tr-lg bg-bg px-3 py-2 text-right font-semibold text-text-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const rowTotal = row.hours.reduce((a, b) => a + b, 0);
              return (
                <tr key={row.projectCode} className="group">
                  <td className="border-b border-border px-3 py-2 text-sm font-medium text-text">
                    <div>{row.projectName}</div>
                    <div className="text-[10px] text-text-subtle">{row.projectCode}</div>
                  </td>
                  {row.hours.map((h, di) => {
                    const isWeekend = di >= 5;
                    return (
                      <td key={di} className="border-b border-border px-1 py-1 text-center">
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={h === 0 ? "" : h}
                          disabled={submitted || isWeekend}
                          placeholder="—"
                          onChange={(e) => updateHours(ri, di, e.target.value)}
                          className={cn(
                            "w-12 rounded border border-transparent bg-transparent px-1 py-0.5 text-center text-sm text-text",
                            "placeholder:text-text-subtle",
                            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                            "disabled:cursor-not-allowed disabled:text-text-subtle",
                            isWeekend && "opacity-40",
                          )}
                        />
                      </td>
                    );
                  })}
                  <td className="border-b border-border px-3 py-2 text-right font-semibold text-text">
                    {rowTotal > 0 ? rowTotal : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="rounded-bl-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Total
              </td>
              {DAY_LABELS.map((_, di) => (
                <td key={di} className="px-1 py-2 text-center text-sm font-semibold text-text">
                  {colTotal(di) > 0 ? colTotal(di) : "—"}
                </td>
              ))}
              <td className="rounded-br-lg px-3 py-2 text-right text-sm font-bold text-text">
                {grandTotal > 0 ? grandTotal : "—"}h
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {submitted
            ? "Timesheet submitted — awaiting manager review."
            : "Log hours for each project. Submit by end of week."}
        </p>
        <Button
          intent="primary"
          size="sm"
          disabled={submitted || grandTotal === 0}
          onClick={handleSubmit}
        >
          {submitted ? "Submitted" : "Submit timesheet"}
        </Button>
      </div>
    </div>
  );
}
