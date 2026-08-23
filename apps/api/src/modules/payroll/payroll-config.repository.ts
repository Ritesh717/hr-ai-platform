import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PayrollConfig, PayrollConfigDocument } from './schemas/payroll-config.schema';

@Injectable()
export class PayrollConfigRepository {
  constructor(
    @InjectModel(PayrollConfig.name) private readonly model: Model<PayrollConfigDocument>,
  ) {}

  async findByEmployee(tenantId: string, employeeId: string): Promise<PayrollConfigDocument | null> {
    return this.model.findOne({
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(employeeId),
    });
  }

  async upsert(
    tenantId: string,
    employeeId: string,
    data: Partial<Omit<PayrollConfig, 'tenantId' | 'employeeId'>>,
  ): Promise<PayrollConfigDocument> {
    return this.model.findOneAndUpdate(
      {
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
      },
      { $set: data },
      { upsert: true, new: true },
    );
  }
}
