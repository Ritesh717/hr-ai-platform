import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type PayrollConfigDocument = HydratedDocument<PayrollConfig>;

export enum EmploymentType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACTOR = 'Contractor',
}

/** Stores the employee's current salary configuration. One record per employee. */
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'payroll_configs',
})
export class PayrollConfig {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, unique: true })
  employeeId: Types.ObjectId;

  /** Annual gross salary */
  @Prop({ required: true, min: 0 })
  grossSalary: number;

  @Prop({ required: true, maxlength: 3 })
  currency: string;

  @Prop({ type: String, enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employmentType: EmploymentType;

  /** ISO date (YYYY-MM-DD) of the next pay date */
  @Prop({ required: true })
  nextPayDate: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PayrollConfigSchema = SchemaFactory.createForClass(PayrollConfig);
