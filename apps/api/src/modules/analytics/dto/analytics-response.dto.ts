export interface MonthPoint {
  month: string;
  value: number;
}

export interface DeptPoint {
  dept: string;
  value: number;
}

export interface RatingPoint {
  rating: string;
  count: number;
}

export class AnalyticsResponseDto {
  headcount: MonthPoint[];
  attrition: MonthPoint[];
  timeToHire: DeptPoint[];
  leaveUtilization: MonthPoint[];
  payrollSpend: MonthPoint[];
  performanceDist: RatingPoint[];
}
