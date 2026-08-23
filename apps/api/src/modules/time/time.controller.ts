import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ClockStatusResponseDto } from './dto/clock-status-response.dto';
import { AttendanceDayResponseDto } from './dto/attendance-day-response.dto';
import { TimesheetWeekResponseDto } from './dto/timesheet-week-response.dto';
import { TimesheetRowUpdateDto } from './dto/timesheet-row-update.dto';
import { TimeService } from './time.service';

@ApiTags('time')
@ApiBearerAuth()
@Controller('time')
@UseGuards(JwtAuthGuard)
export class TimeController {
  constructor(private readonly timeService: TimeService) {}

  @Get('clock-status')
  getClockStatus(@CurrentEmployee() current: CurrentEmployeeType): Promise<ClockStatusResponseDto> {
    return this.timeService.getClockStatus(current.tenantId, current.employeeId);
  }

  @Post('clock-in')
  clockIn(@CurrentEmployee() current: CurrentEmployeeType): Promise<ClockStatusResponseDto> {
    return this.timeService.clockIn(current.tenantId, current.employeeId);
  }

  @Post('clock-out')
  clockOut(@CurrentEmployee() current: CurrentEmployeeType): Promise<ClockStatusResponseDto> {
    return this.timeService.clockOut(current.tenantId, current.employeeId);
  }

  @Get('timesheet/current-week')
  getCurrentWeek(@CurrentEmployee() current: CurrentEmployeeType): Promise<TimesheetWeekResponseDto> {
    return this.timeService.getCurrentWeekTimesheet(current.tenantId, current.employeeId);
  }

  @Put('timesheet/current-week')
  updateRow(
    @Body() dto: TimesheetRowUpdateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<TimesheetWeekResponseDto> {
    return this.timeService.updateTimesheetRow(current.tenantId, current.employeeId, dto);
  }

  @Post('timesheet/current-week/submit')
  submitWeek(@CurrentEmployee() current: CurrentEmployeeType): Promise<TimesheetWeekResponseDto> {
    return this.timeService.submitCurrentWeek(current.tenantId, current.employeeId);
  }

  @Get('attendance')
  getAttendance(
    @Query('year') year: string,
    @Query('month') month: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<AttendanceDayResponseDto[]> {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    return this.timeService.getAttendanceMonth(current.tenantId, current.employeeId, y, m);
  }
}
