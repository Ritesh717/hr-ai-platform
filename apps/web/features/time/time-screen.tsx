"use client";

import { Clock, LogIn, LogOut, Timer } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useClockStatus, useAttendanceMonth, useCurrentWeekTimesheet } from "@/features/time/hooks/use-time-data";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { AttendanceCalendar } from "@/components/patterns/attendance-calendar";
import { TimesheetGrid } from "@/components/patterns/timesheet-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const e = new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${s} – ${e}`;
}

export function TimeScreen() {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  const { data: clockStatus, isLoading: clockLoading } = useClockStatus();
  const { data: week, isLoading: weekLoading } = useCurrentWeekTimesheet();
  const { data: attendanceDays, isLoading: calLoading } = useAttendanceMonth(calYear, calMonth);

  // Initialise local clock state from server data
  const resolvedClocked = clockStatus ? (clockStatus.isClockedIn || isClockedIn) : isClockedIn;

  function toggleClock() {
    if (resolvedClocked) {
      setIsClockedIn(false);
      setClockInTime(null);
    } else {
      setIsClockedIn(true);
      setClockInTime(new Date().toISOString());
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Timer className="size-5" />
          </div>
          <div>
            <h1 className="text-page-title">Time &amp; Attendance</h1>
            <p className="text-sm text-text-muted">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Clock-in / Clock-out status card */}
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                resolvedClocked ? "bg-success/15 text-success" : "bg-text-muted/10 text-text-muted",
              )}
            >
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                {clockLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : resolvedClocked ? (
                  "You're clocked in"
                ) : (
                  "Not clocked in"
                )}
              </p>
              <p className="text-xs text-text-muted">
                {resolvedClocked && clockInTime
                  ? `Since ${formatTime(clockInTime)}`
                  : resolvedClocked && clockStatus?.clockInTime
                  ? `Since ${formatTime(clockStatus.clockInTime)}`
                  : "Start your working day"}
              </p>
            </div>

            {/* Attendance badge */}
            <span
              className={cn(
                "ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                resolvedClocked
                  ? "bg-success/15 text-success"
                  : "bg-text-muted/10 text-text-muted",
              )}
            >
              {resolvedClocked ? "Active" : "Inactive"}
            </span>
          </div>

          <Button
            intent={resolvedClocked ? "secondary" : "primary"}
            size="sm"
            className="self-start sm:self-auto"
            onClick={toggleClock}
          >
            {resolvedClocked ? (
              <>
                <LogOut className="mr-2 size-4" />
                Clock Out
              </>
            ) : (
              <>
                <LogIn className="mr-2 size-4" />
                Clock In
              </>
            )}
          </Button>
        </Card>

        {/* Tabs: Timesheet | Attendance */}
        <Tabs defaultValue="timesheet">
          <TabsList>
            <TabsTrigger value="timesheet">
              This Week
              {week && !weekLoading && (
                <span className="ml-1.5 text-[10px] text-text-subtle">
                  ({formatWeekRange(week.weekStart, week.weekEnd)})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          {/* Timesheet grid */}
          <TabsContent value="timesheet" className="mt-4">
            <Card className="p-5">
              {weekLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : week ? (
                <TimesheetGrid week={week} />
              ) : null}
            </Card>
          </TabsContent>

          {/* Attendance calendar */}
          <TabsContent value="attendance" className="mt-4">
            <Card className="p-5">
              {calLoading ? (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                  ))}
                </div>
              ) : (
                <AttendanceCalendar
                  days={attendanceDays ?? []}
                  year={calYear}
                  month={calMonth}
                  onMonthChange={(y, m) => {
                    setCalYear(y);
                    setCalMonth(m);
                  }}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="time" variant="rail" />
      </div>
    </div>
  );
}
