import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseController } from './expense.controller';
import { ExpenseRepository } from './expense.repository';
import { ExpenseService } from './expense.service';
import { ExpenseReport, ExpenseReportSchema } from './schemas/expense-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseReport.name, schema: ExpenseReportSchema },
    ]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseRepository, ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
