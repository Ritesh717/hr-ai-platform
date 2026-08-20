import { LeaveRequestDocument, LeaveStatus, LeaveType } from '../schemas/leave-request.schema';
import { daysBetweenInclusive } from '../leave-dates.util';

export class LeaveRequestResponseDto {
  id: string;
  tenantId: string;
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(request: LeaveRequestDocument): LeaveRequestResponseDto {
    return {
      id: request._id.toString(),
      tenantId: request.tenantId.toString(),
      employeeId: request.employeeId.toString(),
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      days: daysBetweenInclusive(request.startDate, request.endDate),
      status: request.status,
      reason: request.reason,
      createdAt: request.createdAt as Date,
      updatedAt: request.updatedAt as Date,
    };
  }
}

export class LeaveRequestListResponseDto {
  items: LeaveRequestResponseDto[];
  total: number;
}
