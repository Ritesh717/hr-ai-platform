import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type InterviewDocument = HydratedDocument<Interview>;

export enum InterviewFormat {
  VIDEO = 'Video',
  IN_PERSON = 'In-person',
  PHONE = 'Phone',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Panelist {
  id: string;
  name: string;
  role: string;
}

export interface AgendaItem {
  topic: string;
  durationMin: number;
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'interviews',
})
export class Interview {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Application', required: true, index: true })
  applicationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  candidateId: Types.ObjectId;

  /** Denormalised for display */
  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  scheduledAt: string;

  @Prop({ type: String, enum: InterviewFormat, required: true })
  format: InterviewFormat;

  @Prop({
    type: [{ id: String, name: String, role: String }],
    default: [],
  })
  panelists: Panelist[];

  @Prop({
    type: [{ topic: String, durationMin: Number }],
    default: [],
  })
  agenda: AgendaItem[];

  @Prop({ type: String, enum: InterviewStatus, default: InterviewStatus.SCHEDULED })
  status: InterviewStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);
InterviewSchema.index({ tenantId: 1, candidateId: 1, scheduledAt: 1 });
