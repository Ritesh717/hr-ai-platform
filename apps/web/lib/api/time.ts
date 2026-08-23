import { apiFetch } from "@/lib/api/client";

export type AttendanceStatus = "present" | "remote" | "leave" | "absent" | "weekend" | "holiday";

export interface AttendanceDay {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  hoursWorked?: number;
  note?: string;
}

export interface TimesheetRow {
  projectCode: string;
  projectName: string;
  /** hours[0] = Monday … hours[6] = Sunday */
  hours: number[];
}

export interface TimesheetWeek {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  rows: TimesheetRow[];
  isSubmitted: boolean;
}

export interface ClockStatus {
  isClockedIn: boolean;
  clockInTime?: string; // ISO
}

export async function fetchClockStatus(_employeeId: string): Promise<ClockStatus> {
  return apiFetch<ClockStatus>("/api/v1/time/clock-status");
}

export async function clockIn(): Promise<ClockStatus> {
  return apiFetch<ClockStatus>("/api/v1/time/clock-in", { method: "POST" });
}

export async function clockOut(): Promise<ClockStatus> {
  return apiFetch<ClockStatus>("/api/v1/time/clock-out", { method: "POST" });
}

export async function fetchCurrentWeekTimesheet(_employeeId: string): Promise<TimesheetWeek> {
  return apiFetch<TimesheetWeek>("/api/v1/time/timesheet/current-week");
}

export async function updateTimesheetRow(row: TimesheetRow): Promise<TimesheetWeek> {
  return apiFetch<TimesheetWeek>("/api/v1/time/timesheet/current-week", {
    method: "PUT",
    body: JSON.stringify(row),
  });
}

export async function submitCurrentWeekTimesheet(): Promise<TimesheetWeek> {
  return apiFetch<TimesheetWeek>("/api/v1/time/timesheet/current-week/submit", { method: "POST" });
}

export async function fetchAttendanceMonth(
  _employeeId: string,
  year: number,
  month: number,
): Promise<AttendanceDay[]> {
  return apiFetch<AttendanceDay[]>(`/api/v1/time/attendance?year=${year}&month=${month}`);
}
