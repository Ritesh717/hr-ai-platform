import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ApplicationDocument = HydratedDocument<Application>;

export enum ApplicationStatus {
  ACTIVE = 'active',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Schema({
  timestamps: { createdAt: 'updatedAt', updatedAt: 'updatedAt' },
  collection: 'applications',
})
export class Application {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Job', required: true, index: true })
  jobId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;

  /** Denormalised from Job for efficient display without a join */
  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true })
  department: string;

  @Prop()
  coverNote?: string;

  @Prop({ required: true })
  appliedAt: string;

  /** 0-based index into APPLICATION_STAGES */
  @Prop({ default: 0 })
  currentStage: number;

  @Prop({ type: String, enum: ApplicationStatus, default: ApplicationStatus.ACTIVE })
  status: ApplicationStatus;

  updatedAt?: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
ApplicationSchema.index({ tenantId: 1, employeeId: 1, appliedAt: -1 });
ApplicationSchema.index({ tenantId: 1, jobId: 1, employeeId: 1 }, { unique: true });
