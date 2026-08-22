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

export interface AnalyticsData {
  headcount: MonthPoint[];
  attrition: MonthPoint[];
  timeToHire: DeptPoint[];
  leaveUtilization: MonthPoint[];
  payrollSpend: MonthPoint[];
  performanceDist: RatingPoint[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function fetchAnalytics(): Promise<AnalyticsData> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    headcount: [
      1180, 1195, 1208, 1220, 1230, 1237, 1241, 1244, 1246, 1247, 1248, 1250,
    ].map((value, i) => ({ month: MONTHS[i], value })),

    attrition: [
      4.2, 3.9, 4.5, 4.1, 3.8, 3.5, 3.6, 3.4, 3.1, 3.2, 3.0, 2.9,
    ].map((value, i) => ({ month: MONTHS[i], value })),

    timeToHire: [
      { dept: "Engineering", value: 21 },
      { dept: "Product", value: 28 },
      { dept: "Design", value: 18 },
      { dept: "Sales", value: 14 },
      { dept: "HR", value: 12 },
      { dept: "Finance", value: 16 },
    ],

    leaveUtilization: [
      180, 140, 200, 220, 260, 310, 340, 290, 230, 180, 150, 210,
    ].map((value, i) => ({ month: MONTHS[i], value })),

    payrollSpend: [
      5.2, 5.2, 5.3, 5.3, 5.4, 5.4, 5.5, 5.5, 5.6, 5.6, 5.7, 5.8,
    ].map((value, i) => ({ month: MONTHS[i], value })),

    performanceDist: [
      { rating: "Exceptional", count: 142 },
      { rating: "Exceeds", count: 318 },
      { rating: "Meets", count: 523 },
      { rating: "Developing", count: 198 },
      { rating: "Below", count: 66 },
    ],
  };
}
