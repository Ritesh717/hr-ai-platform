import { LeaveStatus, LeaveType } from '../schemas/leave-request.schema';

// One leave span belonging to a direct report, returned by GET /leave/team.
export class LeaveTeamEntryDto {
  requestId: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  approverId: string | null;
  approverComment: string | null;
  respondedAt: Date | null;
}
