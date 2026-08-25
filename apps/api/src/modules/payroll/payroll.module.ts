import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeModule } from '../employee/employee.module';
import { PayrollConfigRepository } from './payroll-config.repository';
import { PayslipRepository } from './payslip.repository';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollConfig, PayrollConfigSchema } from './schemas/payroll-config.schema';
import { Payslip, PayslipSchema } from './schemas/payslip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollConfig.name, schema: PayrollConfigSchema },
      { name: Payslip.name, schema: PayslipSchema },
    ]),
    EmployeeModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollConfigRepository, PayslipRepository, PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
