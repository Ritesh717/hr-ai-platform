import { LeaveType } from '../schemas/leave-request.schema';

// One approved leave span belonging to a direct report, returned by GET /leave/team.
export class LeaveTeamEntryDto {
  requestId: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
}
