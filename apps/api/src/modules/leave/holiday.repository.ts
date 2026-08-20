import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Holiday, HolidayDocument } from './schemas/holiday.schema';

@Injectable()
export class HolidayRepository {
  constructor(@InjectModel(Holiday.name) private readonly model: Model<HolidayDocument>) {}

  getById(holidayId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<HolidayDocument | null> {
    return this.model.findOne({ _id: holidayId, tenantId }).exec();
  }

  list(tenantId: string | Types.ObjectId): Promise<HolidayDocument[]> {
    return this.model.find({ tenantId }).sort({ date: 1 }).exec();
  }

  async create(data: { tenantId: Types.ObjectId; name: string; date: Date }): Promise<HolidayDocument> {
    const [holiday] = await this.model.create([data]);
    return holiday;
  }

  async delete(holiday: HolidayDocument): Promise<void> {
    await holiday.deleteOne();
  }
}
