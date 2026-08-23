import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type TimesheetEntryDocument = HydratedDocument<TimesheetEntry>;

/**
 * One project-row for a given employee's week.
 * isSubmitted is stored per-row and toggled for all rows of the same week at once.
 */
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'timesheet_entries',
})
export class TimesheetEntry {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;

  /** Monday of the week — YYYY-MM-DD */
  @Prop({ required: true, index: true })
  weekStart: string;

  @Prop({ required: true, maxlength: 50 })
  projectCode: string;

  @Prop({ required: true, maxlength: 200 })
  projectName: string;

  /** hours[0]=Mon … hours[6]=Sun; defaults to 7 zeros */
  @Prop({ type: [Number], default: () => [0, 0, 0, 0, 0, 0, 0] })
  hours: number[];

  @Prop({ default: false })
  isSubmitted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TimesheetEntrySchema = SchemaFactory.createForClass(TimesheetEntry);

TimesheetEntrySchema.index({ tenantId: 1, employeeId: 1, weekStart: 1, projectCode: 1 }, { unique: true });
