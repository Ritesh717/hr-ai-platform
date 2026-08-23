import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from '../employee/schemas/employee.schema';
import { LeaveRequest, LeaveRequestDocument } from '../leave/schemas/leave-request.schema';
import { Payslip, PayslipDocument } from '../payroll/schemas/payslip.schema';
import { requirePermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { AnalyticsResponseDto, MonthPoint } from './dto/analytics-response.dto';

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function last12MonthLabels(): { label: string; year: number; month: number }[] {
  const result = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ label: MONTH_ABBREV[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(LeaveRequest.name) private readonly leaveModel: Model<LeaveRequestDocument>,
    @InjectModel(Payslip.name) private readonly payslipModel: Model<PayslipDocument>,
  ) {}

  async getAnalytics(
    tenantId: string,
    actorPermissions: ReadonlySet<PermissionCode>,
  ): Promise<AnalyticsResponseDto> {
    requirePermission(actorPermissions, PermissionCode.ANALYTICS_READ);
    const [headcount, leaveUtilization, payrollSpend] = await Promise.all([
      this.headcountTrend(tenantId),
      this.leaveUtilizationTrend(tenantId),
      this.payrollSpendTrend(tenantId),
    ]);

    return {
      headcount,
      attrition: [],
      timeToHire: [],
      leaveUtilization,
      payrollSpend,
      performanceDist: [],
    };
  }

  private async headcountTrend(tenantId: string): Promise<MonthPoint[]> {
    const months = last12MonthLabels();
    const tidObj = new Types.ObjectId(tenantId);

    // Count employees hired on or before end of each month (cumulative hires as headcount proxy)
    const result: MonthPoint[] = [];
    for (const { label, year, month } of months) {
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      const count = await this.employeeModel.countDocuments({
        tenantId: tidObj,
        hireDate: { $lte: endOfMonth },
      });
      result.push({ month: label, value: count });
    }
    return result;
  }

  private async leaveUtilizationTrend(tenantId: string): Promise<MonthPoint[]> {
    const months = last12MonthLabels();
    const tidObj = new Types.ObjectId(tenantId);

    // Sum approved leave days per month (by month of startDate)
    const rows = await this.leaveModel.aggregate([
      {
        $match: {
          tenantId: tidObj,
          status: 'approved',
          startDate: { $gte: new Date(months[0].year, months[0].month - 1, 1) },
        },
      },
      {
        $project: {
          year: { $year: '$startDate' },
          month: { $month: '$startDate' },
          days: {
            $add: [
              { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 86400000] },
              1,
            ],
          },
        },
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          total: { $sum: '$days' },
        },
      },
    ]);

    const byKey = new Map<string, number>();
    for (const r of rows) {
      byKey.set(`${r._id.year}-${r._id.month}`, Math.round(r.total));
    }

    return months.map(({ label, year, month }) => ({
      month: label,
      value: byKey.get(`${year}-${month}`) ?? 0,
    }));
  }

  private async payrollSpendTrend(tenantId: string): Promise<MonthPoint[]> {
    const months = last12MonthLabels();
    const tidObj = new Types.ObjectId(tenantId);
    const startYearPrefix = `${months[0].year}-`;
    const prevYearPrefix = `${months[0].year - 1}-`;

    // Sum gross payroll by YYYY-MM from periodStart string field
    const rows = await this.payslipModel.aggregate([
      {
        $match: {
          tenantId: tidObj,
          $or: [
            { periodStart: { $regex: `^${startYearPrefix}` } },
            { periodStart: { $regex: `^${prevYearPrefix}` } },
          ],
        },
      },
      {
        $project: {
          yearMonth: { $substr: ['$periodStart', 0, 7] }, // "YYYY-MM"
          grossAmount: 1,
        },
      },
      {
        $group: {
          _id: '$yearMonth',
          total: { $sum: '$grossAmount' },
        },
      },
    ]);

    const byKey = new Map<string, number>();
    for (const r of rows) {
      byKey.set(r._id as string, r.total);
    }

    return months.map(({ label, year, month }) => {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const raw = byKey.get(key) ?? 0;
      return { month: label, value: Math.round(raw / 1_000_000 * 100) / 100 }; // convert to £M
    });
  }
}
