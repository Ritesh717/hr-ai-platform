import { PayslipDocument, PayslipStatus } from '../schemas/payslip.schema';
import { PayBreakdownRow } from '../schemas/payslip.schema';

export class PayslipResponseDto {
  id: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
  status: PayslipStatus;
  breakdown: PayBreakdownRow[];

  static fromDocument(doc: PayslipDocument): PayslipResponseDto {
    return {
      id: (doc._id as any).toString(),
      month: doc.month,
      periodStart: doc.periodStart,
      periodEnd: doc.periodEnd,
      grossAmount: doc.grossAmount,
      netAmount: doc.netAmount,
      currency: doc.currency,
      status: doc.status,
      breakdown: doc.breakdown,
    };
  }
}
