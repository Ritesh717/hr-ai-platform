import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { LeaveRequest, LeaveRequestSchema } from '../leave/schemas/leave-request.schema';
import { Payslip, PayslipSchema } from '../payroll/schemas/payslip.schema';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Payslip.name, schema: PayslipSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
