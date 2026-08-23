import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type PayslipDocument = HydratedDocument<Payslip>;

export enum PayslipStatus {
  PAID = 'Paid',
  PROCESSING = 'Processing',
}

export interface PayBreakdownRow {
  label: string;
  amount: number;
  isDeduction?: boolean;
  isNet?: boolean;
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'payslips',
})
export class Payslip {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;

  /** "August 2026" */
  @Prop({ required: true })
  month: string;

  /** YYYY-MM-DD */
  @Prop({ required: true })
  periodStart: string;

  /** YYYY-MM-DD */
  @Prop({ required: true })
  periodEnd: string;

  @Prop({ required: true, min: 0 })
  grossAmount: number;

  @Prop({ required: true, min: 0 })
  netAmount: number;

  @Prop({ required: true, maxlength: 3 })
  currency: string;

  @Prop({ type: String, enum: PayslipStatus, default: PayslipStatus.PROCESSING })
  status: PayslipStatus;

  @Prop({ type: [{ label: String, amount: Number, isDeduction: Boolean, isNet: Boolean }], default: [] })
  breakdown: PayBreakdownRow[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);

PayslipSchema.index({ tenantId: 1, employeeId: 1, periodStart: 1 }, { unique: true });
