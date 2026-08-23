import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type JobDocument = HydratedDocument<Job>;

export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  REMOTE = 'Remote',
}

export enum ExperienceLevel {
  ENTRY = 'Entry',
  MID = 'Mid',
  SENIOR = 'Senior',
  LEAD = 'Lead',
  DIRECTOR = 'Director',
}

export enum JobStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  DRAFT = 'draft',
}

export interface JobSection {
  heading: string;
  body: string;
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'jobs',
})
export class Job {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  location: string;

  @Prop({ type: String, enum: JobType, required: true })
  type: JobType;

  @Prop({ type: String, enum: ExperienceLevel, required: true })
  experienceLevel: ExperienceLevel;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [{ heading: String, body: String }], default: [] })
  sections: JobSection[];

  @Prop({ required: true })
  postedAt: string;

  @Prop({ type: String, enum: JobStatus, default: JobStatus.OPEN })
  status: JobStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ tenantId: 1, status: 1, postedAt: -1 });
