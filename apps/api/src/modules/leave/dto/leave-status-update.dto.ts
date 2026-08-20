import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeaveStatus } from '../schemas/leave-request.schema';

export class LeaveStatusUpdateDto {
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
