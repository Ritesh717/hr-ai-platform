import { IsEnum } from 'class-validator';
import { LeaveStatus } from '../schemas/leave-request.schema';

export class LeaveStatusUpdateDto {
  @IsEnum(LeaveStatus)
  status: LeaveStatus;
}
