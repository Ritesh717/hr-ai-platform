import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimesheetEntry, TimesheetEntryDocument } from './schemas/timesheet-entry.schema';

@Injectable()
export class TimesheetEntryRepository {
  constructor(
    @InjectModel(TimesheetEntry.name) private readonly model: Model<TimesheetEntryDocument>,
  ) {}

  async findWeek(tenantId: string, employeeId: string, weekStart: string): Promise<TimesheetEntryDocument[]> {
    return this.model.find({
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(employeeId),
      weekStart,
    });
  }

  async upsertRow(
    tenantId: string,
    employeeId: string,
    weekStart: string,
    projectCode: string,
    projectName: string,
    hours: number[],
  ): Promise<TimesheetEntryDocument> {
    return this.model.findOneAndUpdate(
      {
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
        weekStart,
        projectCode,
      },
      { $set: { projectName, hours } },
      { upsert: true, new: true },
    );
  }

  async submitWeek(tenantId: string, employeeId: string, weekStart: string): Promise<void> {
    await this.model.updateMany(
      {
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
        weekStart,
      },
      { $set: { isSubmitted: true } },
    );
  }
}
