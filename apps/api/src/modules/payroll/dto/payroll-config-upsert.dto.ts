import { IsEnum, IsNumber, IsString, Length, Min } from 'class-validator';
import { EmploymentType } from '../schemas/payroll-config.schema';

export class PayrollConfigUpsertDto {
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
