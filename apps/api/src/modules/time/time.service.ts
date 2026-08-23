import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceDayResponseDto, AttendanceStatus } from './dto/attendance-day-response.dto';
import { ClockStatusResponseDto } from './dto/clock-status-response.dto';
import { TimesheetRowUpdateDto } from './dto/timesheet-row-update.dto';
import { TimesheetWeekResponseDto } from './dto/timesheet-week-response.dto';
import { ClockEntryRepository } from './clock-entry.repository';
import { TimesheetEntryRepository } from './timesheet-entry.repository';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayOf(ref: Date): Date {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class TimeService {
  constructor(
    private readonly clockEntryRepo: ClockEntryRepository,
    private readonly timesheetRepo: TimesheetEntryRepository,
  ) {}

  async getClockStatus(tenantId: string, employeeId: string): Promise<ClockStatusResponseDto> {
    const open = await this.clockEntryRepo.findOpenEntry(tenantId, employeeId);
    return ClockStatusResponseDto.fromEntry(open);
  }

  async clockIn(tenantId: string, employeeId: string): Promise<ClockStatusResponseDto> {
    const open = await this.clockEntryRepo.findOpenEntry(tenantId, employeeId);
    if (open) throw new BadRequestException('Already clocked in');
    const date = isoDate(new Date());
    const entry = await this.clockEntryRepo.clockIn(tenantId, employeeId, date);
    return ClockStatusResponseDto.fromEntry(entry);
  }

  async clockOut(tenantId: string, employeeId: string): Promise<ClockStatusResponseDto> {
    const open = await this.clockEntryRepo.findOpenEntry(tenantId, employeeId);
    if (!open) throw new BadRequestException('Not clocked in');
    await this.clockEntryRepo.clockOut((open._id as any).toString());
    return { isClockedIn: false };
  }

  async getCurrentWeekTimesheet(
    tenantId: string,
    employeeId: string,
  ): Promise<TimesheetWeekResponseDto> {
    const mon = mondayOf(new Date());
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    const weekStart = isoDate(mon);
    const weekEnd = isoDate(sun);

    const rows = await this.timesheetRepo.findWeek(tenantId, employeeId, weekStart);
    const isSubmitted = rows.length > 0 && rows.every((r) => r.isSubmitted);

    return {
      weekStart,
      weekEnd,
      isSubmitted,
      rows: rows.map((r) => ({
        projectCode: r.projectCode,
        projectName: r.projectName,
        hours: r.hours,
      })),
    };
  }

  async updateTimesheetRow(
    tenantId: string,
    employeeId: string,
    dto: TimesheetRowUpdateDto,
  ): Promise<TimesheetWeekResponseDto> {
    const weekStart = isoDate(mondayOf(new Date()));
    await this.timesheetRepo.upsertRow(
      tenantId,
      employeeId,
      weekStart,
      dto.projectCode,
      dto.projectName,
      dto.hours,
    );
    return this.getCurrentWeekTimesheet(tenantId, employeeId);
  }

  async submitCurrentWeek(tenantId: string, employeeId: string): Promise<TimesheetWeekResponseDto> {
    const weekStart = isoDate(mondayOf(new Date()));
    const rows = await this.timesheetRepo.findWeek(tenantId, employeeId, weekStart);
    if (rows.length === 0) throw new BadRequestException('No timesheet rows to submit');
    await this.timesheetRepo.submitWeek(tenantId, employeeId, weekStart);
    return this.getCurrentWeekTimesheet(tenantId, employeeId);
  }

  async getAttendanceMonth(
    tenantId: string,
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AttendanceDayResponseDto[]> {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const entries = await this.clockEntryRepo.findByMonth(tenantId, employeeId, yearMonth);
    const clockedDates = new Set(entries.map((e) => e.date));

    const days: AttendanceDayResponseDto[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = isoDate(new Date());

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const key = isoDate(date);
      const weekday = date.getDay();

      if (weekday === 0 || weekday === 6) {
        days.push({ date: key, status: 'weekend' });
        continue;
      }
      if (key > today) {
        days.push({ date: key, status: 'absent' });
        continue;
      }

      let status: AttendanceStatus;
      let hoursWorked: number | undefined;

      if (clockedDates.has(key)) {
        const entry = entries.find((e) => e.date === key);
        if (entry?.clockOutTime) {
          const ms = entry.clockOutTime.getTime() - entry.clockInTime.getTime();
          hoursWorked = Math.round((ms / 3_600_000) * 10) / 10;
        }
        status = 'present';
      } else {
        status = 'absent';
      }

      days.push({ date: key, status, hoursWorked });
    }

    return days;
  }
}
