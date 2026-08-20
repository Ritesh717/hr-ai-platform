import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type LeaveRequestDocument = HydratedDocument<LeaveRequest>;

export enum LeaveType {
  VACATION = 'vacation',
  SICK = 'sick',
  PERSONAL = 'personal',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'leave_requests' })
export class LeaveRequest {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;

  @Prop({ type: String, enum: LeaveType, required: true })
  type: LeaveType;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: String, enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Prop({ type: String, maxlength: 500, default: null })
  reason: string | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', default: null })
  approverId: Types.ObjectId | null;

  @Prop({ type: String, maxlength: 500, default: null })
  approverComment: string | null;

  @Prop({ type: Date, default: null })
  respondedAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

const LEAVE_STATUS_VALUES = new Set<string>(Object.values(LeaveStatus));

export function isLeaveStatus(value: string): value is LeaveStatus {
  return LEAVE_STATUS_VALUES.has(value);
}
