import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { LeaveBalanceResponseDto } from './dto/leave-balance-response.dto';
import { LeaveRequestCreateDto } from './dto/leave-request-create.dto';
import { LeaveRequestListResponseDto, LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { LeaveRequestUpdateDto } from './dto/leave-request-update.dto';
import { LeaveStatusUpdateDto } from './dto/leave-status-update.dto';
import { LeaveTeamEntryDto } from './dto/leave-team-entry.dto';
import { LeaveService } from './leave.service';
import { LeaveStatus, isLeaveStatus } from './schemas/leave-request.schema';

// Thin: extracts CurrentEmployee and delegates to LeaveService — permission checks happen there.
@Controller('api/v1/leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('requests')
  async listRequests(
    @Query('employeeId') employeeId: string | undefined,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<LeaveRequestListResponseDto> {
    const requests = await this.leaveService.listRequests({
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
      employeeId,
    });
    const items = requests.map((request) => LeaveRequestResponseDto.fromDocument(request));
    return { items, total: items.length };
  }

  @Post('requests')
  async createRequest(
    @Body() dto: LeaveRequestCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<LeaveRequestResponseDto> {
    const request = await this.leaveService.createRequest(dto, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
    });
    return LeaveRequestResponseDto.fromDocument(request);
  }

  @Patch('requests/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: LeaveStatusUpdateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<LeaveRequestResponseDto> {
    const request = await this.leaveService.updateStatus(id, dto.status, dto.comment, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
    });
    return LeaveRequestResponseDto.fromDocument(request);
  }

  @Patch('requests/:id')
  async editRequest(
    @Param('id') id: string,
    @Body() dto: LeaveRequestUpdateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<LeaveRequestResponseDto> {
    const request = await this.leaveService.editRequest(id, dto, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
    });
    return LeaveRequestResponseDto.fromDocument(request);
  }

  @Get('balance')
  getBalance(
    @Query('employeeId') employeeId: string | undefined,
    @Query('year') year: string | undefined,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<LeaveBalanceResponseDto> {
    return this.leaveService.getBalance({
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
      employeeId,
      year: year ? Number(year) : undefined,
    });
  }

  @Get('team')
  getTeam(
    @Query('status') status: string | undefined,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<LeaveTeamEntryDto[]> {
    const statuses = status
      ? (status.split(',').filter(isLeaveStatus) as LeaveStatus[])
      : undefined;
    return this.leaveService.getTeamLeave({ tenantId: current.tenantId, actorId: current.employeeId, statuses });
  }
}
