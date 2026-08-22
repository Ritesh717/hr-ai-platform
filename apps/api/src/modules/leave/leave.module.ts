import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeModule } from '../employee/employee.module';
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
    // EmployeeRepository (exported by EmployeeModule) is needed by LeaveService.getTeamLeave()
    // to resolve a manager's direct reports — using the proper module abstraction rather than
    // directly injecting the Employee model.
    EmployeeModule,
  ],
  controllers: [LeaveController, HolidayController],
  providers: [LeaveRequestRepository, HolidayRepository, LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
