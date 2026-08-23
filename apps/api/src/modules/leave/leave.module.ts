import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeModule } from '../employee/employee.module';
import { NotificationModule } from '../notifications/notification.module';
import { HolidayController } from './holiday.controller';
import { HolidayRepository } from './holiday.repository';
import { LeaveController } from './leave.controller';
import { LeaveRequestRepository } from './leave-request.repository';
import { LeaveService } from './leave.service';
import { Holiday, HolidaySchema } from './schemas/holiday.schema';
import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Holiday.name, schema: HolidaySchema },
    ]),
    EmployeeModule,
    NotificationModule,
  ],
  controllers: [LeaveController, HolidayController],
  providers: [LeaveRequestRepository, HolidayRepository, LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
