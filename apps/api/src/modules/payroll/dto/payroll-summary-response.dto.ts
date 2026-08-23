import { EmploymentType } from '../schemas/payroll-config.schema';
import { PayBreakdownRow } from '../schemas/payslip.schema';

export class PayrollSummaryResponseDto {
  grossSalary: number;
  netSalary: number;
  currency: string;
  nextPayDate: string;
  employmentType: EmploymentType;
  ytdEarnings: number;
  breakdown: PayBreakdownRow[];
}
