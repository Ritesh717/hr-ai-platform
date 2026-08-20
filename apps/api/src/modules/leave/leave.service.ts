import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundError, ValidationAppError } from '../../common/errors/app.error';
import { Employee, EmployeeDocument } from '../employee/schemas/employee.schema';
import { requirePermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { HolidayCreateDto } from './dto/holiday-create.dto';
import { LeaveBalanceResponseDto } from './dto/leave-balance-response.dto';
import { LeaveRequestCreateDto } from './dto/leave-request-create.dto';
import { LeaveTeamEntryDto } from './dto/leave-team-entry.dto';
import { daysBetweenInclusive } from './leave-dates.util';
import { HolidayRepository } from './holiday.repository';
import { LeaveRequestRepository } from './leave-request.repository';
import { HolidayDocument } from './schemas/holiday.schema';
import { LeaveRequestDocument, LeaveStatus } from './schemas/leave-request.schema';

// No LeaveBalance collection: no endpoint in this batch ever writes a per-employee allocation,
// so persisting one would be dead schema. Every employee gets the same flat allocation; usedDays
// is always derived live from approved requests (mirrors the plan's "never stored" balance rule).
const DEFAULT_ANNUAL_LEAVE_DAYS = 20;

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly holidayRepository: HolidayRepository,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async listRequests(params: {
    tenantId: string;
    actorId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    employeeId?: string;
  }): Promise<LeaveRequestDocument[]> {
    const targetId = params.employeeId ?? params.actorId;
    if (targetId !== params.actorId) {
      requirePermission(params.actorPermissions, PermissionCode.LEAVE_READ);
    }
    return this.leaveRequestRepository.listForEmployee({ tenantId: params.tenantId, employeeId: targetId });
  }

  async createRequest(
    payload: LeaveRequestCreateDto,
    params: { tenantId: string; actorId: string },
  ): Promise<LeaveRequestDocument> {
    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
    if (endDate < startDate) {
      throw new ValidationAppError('endDate must not be before startDate');
    }

    return this.leaveRequestRepository.create({
      tenantId: new Types.ObjectId(params.tenantId),
      employeeId: new Types.ObjectId(params.actorId),
      type: payload.type,
      startDate,
      endDate,
      status: LeaveStatus.PENDING,
      reason: payload.reason ?? null,
    });
  }

  async updateStatus(
    requestId: string,
    status: LeaveStatus,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<LeaveRequestDocument> {
    requirePermission(params.actorPermissions, PermissionCode.LEAVE_APPROVE);
    const request = await this.leaveRequestRepository.getById(requestId, params.tenantId);
    if (!request) throw new NotFoundError(`Leave request ${requestId} not found`);
    request.status = status;
    return this.leaveRequestRepository.save(request);
  }

  async getBalance(params: {
    tenantId: string;
    actorId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    employeeId?: string;
    year?: number;
  }): Promise<LeaveBalanceResponseDto> {
    const targetId = params.employeeId ?? params.actorId;
    if (targetId !== params.actorId) {
      requirePermission(params.actorPermissions, PermissionCode.LEAVE_READ);
    }
    const year = params.year ?? new Date().getFullYear();

    const approved = await this.leaveRequestRepository.listApprovedInYear({
      tenantId: params.tenantId,
      employeeId: targetId,
      year,
    });
    const usedDays = approved.reduce((sum, request) => sum + daysBetweenInclusive(request.startDate, request.endDate), 0);

    return {
      employeeId: targetId,
      year,
      allocatedDays: DEFAULT_ANNUAL_LEAVE_DAYS,
      usedDays,
      remainingDays: DEFAULT_ANNUAL_LEAVE_DAYS - usedDays,
    };
  }

  async getTeamLeave(params: { tenantId: string; actorId: string; status?: LeaveStatus }): Promise<LeaveTeamEntryDto[]> {
    const reports = await this.employeeModel
      .find({ tenantId: params.tenantId, managerId: params.actorId })
      .select('_id fullName')
      .exec();
    if (reports.length === 0) return [];

    const nameById = new Map(reports.map((employee) => [employee._id.toString(), employee.fullName]));
    const requests = await this.leaveRequestRepository.listForEmployees({
      tenantId: params.tenantId,
      employeeIds: reports.map((employee) => employee._id),
      status: params.status,
    });

    return requests.map((request) => ({
      employeeId: request.employeeId.toString(),
      employeeName: nameById.get(request.employeeId.toString()) ?? 'Unknown',
      requestId: request._id.toString(),
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      days: daysBetweenInclusive(request.startDate, request.endDate),
    }));
  }

  listHolidays(tenantId: string): Promise<HolidayDocument[]> {
    return this.holidayRepository.list(tenantId);
  }

  async createHoliday(
    payload: HolidayCreateDto,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<HolidayDocument> {
    requirePermission(params.actorPermissions, PermissionCode.LEAVE_MANAGE);
    return this.holidayRepository.create({
      tenantId: new Types.ObjectId(params.tenantId),
      name: payload.name,
      date: new Date(payload.date),
    });
  }

  async deleteHoliday(
    holidayId: string,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<void> {
    requirePermission(params.actorPermissions, PermissionCode.LEAVE_MANAGE);
    const holiday = await this.holidayRepository.getById(holidayId, params.tenantId);
    if (!holiday) throw new NotFoundError(`Holiday ${holidayId} not found`);
    await this.holidayRepository.delete(holiday);
  }
}
