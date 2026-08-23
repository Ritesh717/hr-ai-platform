import { apiFetch } from "./client";

export type EmploymentType = "Full-time" | "Part-time" | "Contractor";
export type PayslipStatus = "Paid" | "Processing";

export interface PayBreakdownRow {
  label: string;
  amount: number;
  isDeduction?: boolean;
  isNet?: boolean;
}

export interface PayrollSummary {
  grossSalary: number;
  netSalary: number;
  currency: string;
  nextPayDate: string;
  employmentType: EmploymentType;
  ytdEarnings: number;
  breakdown: PayBreakdownRow[];
}

export interface Payslip {
  id: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
  status: PayslipStatus;
}

export async function fetchPayrollSummary(_employeeId: string): Promise<PayrollSummary> {
  return apiFetch<PayrollSummary>("/api/v1/payroll/summary");
}

export async function fetchPayslips(_employeeId: string): Promise<Payslip[]> {
  return apiFetch<Payslip[]>("/api/v1/payroll/payslips");
}

export async function fetchPayslip(id: string): Promise<Payslip> {
  return apiFetch<Payslip>(`/api/v1/payroll/payslips/${id}`);
}
