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
  month: string; // e.g. "August 2026"
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
  status: PayslipStatus;
}

export async function fetchPayrollSummary(_employeeId: string): Promise<PayrollSummary> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    grossSalary: 75_000,
    netSalary: 53_250,
    currency: "GBP",
    nextPayDate: "2026-08-29",
    employmentType: "Full-time",
    ytdEarnings: 43_750,
    breakdown: [
      { label: "Base salary",        amount: 6_250 },
      { label: "Performance bonus",  amount: 500 },
      { label: "Travel allowance",   amount: 200 },
      { label: "Income tax (PAYE)",  amount: -1_950, isDeduction: true },
      { label: "National Insurance", amount: -437,  isDeduction: true },
      { label: "Pension (employee)", amount: -313,  isDeduction: true },
      { label: "Net pay",            amount: 4_250, isNet: true },
    ],
  };
}

export async function fetchPayslips(_employeeId: string): Promise<Payslip[]> {
  await new Promise((r) => setTimeout(r, 250));
  return [
    {
      id: "ps-aug-2026", month: "August 2026",
      periodStart: "2026-08-01", periodEnd: "2026-08-31",
      grossAmount: 6_750, netAmount: 4_250, currency: "GBP", status: "Processing",
    },
    {
      id: "ps-jul-2026", month: "July 2026",
      periodStart: "2026-07-01", periodEnd: "2026-07-31",
      grossAmount: 6_750, netAmount: 4_250, currency: "GBP", status: "Paid",
    },
    {
      id: "ps-jun-2026", month: "June 2026",
      periodStart: "2026-06-01", periodEnd: "2026-06-30",
      grossAmount: 6_250, netAmount: 4_063, currency: "GBP", status: "Paid",
    },
    {
      id: "ps-may-2026", month: "May 2026",
      periodStart: "2026-05-01", periodEnd: "2026-05-31",
      grossAmount: 6_250, netAmount: 4_063, currency: "GBP", status: "Paid",
    },
    {
      id: "ps-apr-2026", month: "April 2026",
      periodStart: "2026-04-01", periodEnd: "2026-04-30",
      grossAmount: 6_250, netAmount: 4_063, currency: "GBP", status: "Paid",
    },
  ];
}
