import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClockEntry, ClockEntryDocument } from './schemas/clock-entry.schema';

@Injectable()
export class ClockEntryRepository {
  constructor(
    @InjectModel(ClockEntry.name) private readonly model: Model<ClockEntryDocument>,
  ) {}

  async findOpenEntry(tenantId: string, employeeId: string): Promise<ClockEntryDocument | null> {
    return this.model.findOne({
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(employeeId),
      clockOutTime: null,
    });
  }

  async clockIn(tenantId: string, employeeId: string, date: string): Promise<ClockEntryDocument> {
    return this.model.create({
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(employeeId),
      date,
      clockInTime: new Date(),
      clockOutTime: null,
    });
  }

  async clockOut(entryId: string): Promise<ClockEntryDocument | null> {
    return this.model.findByIdAndUpdate(
      entryId,
      { clockOutTime: new Date() },
      { new: true },
    );
  }

  async findByMonth(
    tenantId: string,
    employeeId: string,
    yearMonth: string, // e.g. "2026-08"
  ): Promise<ClockEntryDocument[]> {
    return this.model.find({
      tenantId: new Types.ObjectId(tenantId),
      employeeId: new Types.ObjectId(employeeId),
      date: { $regex: `^${yearMonth}` },
    });
  }
}
