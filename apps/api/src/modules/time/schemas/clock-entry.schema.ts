import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ClockEntryDocument = HydratedDocument<ClockEntry>;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'clock_entries',
})
export class ClockEntry {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;

  /** YYYY-MM-DD — indexed for fast attendance-month lookups */
  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true })
  clockInTime: Date;

  @Prop({ type: Date, default: null })
  clockOutTime: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClockEntrySchema = SchemaFactory.createForClass(ClockEntry);

ClockEntrySchema.index({ tenantId: 1, employeeId: 1, date: 1 });
