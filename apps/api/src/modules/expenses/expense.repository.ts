import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseReport, ExpenseReportDocument, ExpenseStatus } from './schemas/expense-report.schema';

@Injectable()
export class ExpenseRepository {
  constructor(
    @InjectModel(ExpenseReport.name) private readonly model: Model<ExpenseReportDocument>,
  ) {}

  async findByEmployee(tenantId: string, employeeId: string): Promise<ExpenseReportDocument[]> {
    return this.model
      .find({
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
      })
      .sort({ submittedAt: -1 });
  }

  async findById(id: string): Promise<ExpenseReportDocument | null> {
    return this.model.findById(id);
  }

  async create(
    tenantId: string,
    employeeId: string,
    data: Omit<ExpenseReport, 'tenantId' | 'employeeId'>,
  ): Promise<ExpenseReportDocument> {
    return this.model.create({
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(employeeId),
    });
  }

  async submit(id: string): Promise<ExpenseReportDocument | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { status: ExpenseStatus.SUBMITTED, submittedAt: new Date().toISOString() } },
      { new: true },
    );
  }

  async updateStatus(
    id: string,
    status: ExpenseStatus,
    approvedById?: string,
  ): Promise<ExpenseReportDocument | null> {
    const update: Record<string, unknown> = { status };
    if (approvedById) update.approvedById = new Types.ObjectId(approvedById);
    return this.model.findByIdAndUpdate(id, { $set: update }, { new: true });
  }

  async findSubmittedForManager(
    tenantId: string,
    managerEmployeeIds: string[],
  ): Promise<ExpenseReportDocument[]> {
    if (managerEmployeeIds.length === 0) return [];
    return this.model
      .find({
        tenantId: new Types.ObjectId(tenantId),
        employeeId: { $in: managerEmployeeIds.map((id) => new Types.ObjectId(id)) },
        status: ExpenseStatus.SUBMITTED,
      })
      .sort({ submittedAt: -1 });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
}
