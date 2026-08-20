import { HolidayDocument } from '../schemas/holiday.schema';

export class HolidayResponseDto {
  id: string;
  tenantId: string;
  name: string;
  date: Date;

  static fromDocument(holiday: HolidayDocument): HolidayResponseDto {
    return {
      id: holiday._id.toString(),
      tenantId: holiday.tenantId.toString(),
      name: holiday.name,
      date: holiday.date,
    };
  }
}
