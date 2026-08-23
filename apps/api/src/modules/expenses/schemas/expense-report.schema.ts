import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ExpenseReportDocument = HydratedDocument<ExpenseReport>;

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REIMBURSED = 'reimbursed',
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  ACCOMMODATION = 'accommodation',
  MEALS = 'meals',
  EQUIPMENT = 'equipment',
  TRAINING = 'training',
  OTHER = 'other',
}

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: ExpenseStatus;
  receiptFilename?: string;
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'expense_reports',
})
export class ExpenseReport {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  /** Set when the report is first submitted; optional on draft creation */
  @Prop()
  submittedAt?: string;

  @Prop({ type: String, enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  status: ExpenseStatus;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ required: true, maxlength: 3 })
  currency: string;

  @Prop({
    type: [
      {
        id: String,
        category: { type: String, enum: Object.values(ExpenseCategory) },
        description: String,
        amount: Number,
        currency: String,
        date: String,
        status: { type: String, enum: Object.values(ExpenseStatus) },
        receiptFilename: String,
      },
    ],
    default: [],
  })
  items: ExpenseItem[];

  @Prop()
  notes?: string;

  /** Employee who approved or rejected this report */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee' })
  approvedById?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExpenseReportSchema = SchemaFactory.createForClass(ExpenseReport);

ExpenseReportSchema.index({ tenantId: 1, employeeId: 1, submittedAt: -1 });
