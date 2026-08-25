import { IsEnum, IsMongoId, IsNumber, IsString, Length, Min } from 'class-validator';
import { EmploymentType } from '../schemas/payroll-config.schema';

export class PayrollConfigUpsertDto {
  /** Target employee whose payroll config is being set — always the caller's choice, never inferred from the caller. */
  @IsMongoId()
  employeeId: string;

  @IsNumber()
  @Min(0)
  grossSalary: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsString()
  nextPayDate: string;
}
