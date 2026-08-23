import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClockEntryRepository } from './clock-entry.repository';
import { TimesheetEntryRepository } from './timesheet-entry.repository';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';
import { ClockEntry, ClockEntrySchema } from './schemas/clock-entry.schema';
import { TimesheetEntry, TimesheetEntrySchema } from './schemas/timesheet-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClockEntry.name, schema: ClockEntrySchema },
      { name: TimesheetEntry.name, schema: TimesheetEntrySchema },
    ]),
  ],
  controllers: [TimeController],
  providers: [ClockEntryRepository, TimesheetEntryRepository, TimeService],
  exports: [TimeService],
})
export class TimeModule {}
