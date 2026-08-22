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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayOf(ref: Date): Date {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export async function fetchClockStatus(_employeeId: string): Promise<ClockStatus> {
  await new Promise((r) => setTimeout(r, 100));
  return { isClockedIn: false };
}

export async function fetchCurrentWeekTimesheet(_employeeId: string): Promise<TimesheetWeek> {
  await new Promise((r) => setTimeout(r, 200));
  const mon = mondayOf(new Date());
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return {
    weekStart: isoDate(mon),
    weekEnd: isoDate(sun),
    isSubmitted: false,
    rows: [
      { projectCode: "PROJ-01", projectName: "Platform Redesign", hours: [8, 7.5, 8, 8, 7, 0, 0] },
      { projectCode: "PROJ-02", projectName: "HR Integration API",  hours: [0, 0.5, 0, 0, 1, 0, 0] },
      { projectCode: "INTERNAL", projectName: "Internal / Meetings", hours: [0, 0, 0, 0, 0, 0, 0] },
    ],
  };
}

export async function fetchAttendanceMonth(
  _employeeId: string,
  year: number,
  month: number,
): Promise<AttendanceDay[]> {
  await new Promise((r) => setTimeout(r, 250));

  const days: AttendanceDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = isoDate(new Date());

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const key = isoDate(date);
    const weekday = date.getDay(); // 0 = Sun, 6 = Sat

    if (weekday === 0 || weekday === 6) {
      days.push({ date: key, status: "weekend" });
      continue;
    }
    if (key > today) {
      days.push({ date: key, status: "absent" });
      continue;
    }
    // Deterministic mock statuses based on day number
    const status: AttendanceStatus =
      d % 15 === 0 ? "leave" :
      d % 7 === 0  ? "remote" :
      d % 11 === 0 ? "absent" :
      "present";
    const hoursWorked = status === "present" ? 8 : status === "remote" ? 7.5 : undefined;
    days.push({ date: key, status, hoursWorked });
  }

  return days;
}
