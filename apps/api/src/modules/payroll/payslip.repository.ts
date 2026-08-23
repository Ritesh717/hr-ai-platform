import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payslip, PayslipDocument } from './schemas/payslip.schema';

@Injectable()
export class PayslipRepository {
  constructor(
    @InjectModel(Payslip.name) private readonly model: Model<PayslipDocument>,
  ) {}

  async findByEmployee(tenantId: string, employeeId: string): Promise<PayslipDocument[]> {
    return this.model
      .find({
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
      })
      .sort({ periodStart: -1 });
  }

  async findLatestByEmployee(tenantId: string, employeeId: string): Promise<PayslipDocument | null> {
    return this.model
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
      })
      .sort({ periodStart: -1 });
  }

  async findById(id: string): Promise<PayslipDocument | null> {
    return this.model.findById(id);
  }

  async create(
    tenantId: string,
    data: Omit<Payslip, 'tenantId' | 'employeeId'> & { employeeId: string },
  ): Promise<PayslipDocument> {
    return this.model.create({
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(data.employeeId),
    });
  }

  /** YTD earnings: sum of grossAmount for payslips in the given calendar year */
  async sumYtdEarnings(tenantId: string, employeeId: string, year: number): Promise<number> {
    const yearPrefix = `${year}-`;
    const result = await this.model.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          employeeId: new Types.ObjectId(employeeId),
          periodStart: { $regex: `^${yearPrefix}` },
        },
      },
      { $group: { _id: null, total: { $sum: '$grossAmount' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}
