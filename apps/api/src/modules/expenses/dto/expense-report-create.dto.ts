import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory, ExpenseStatus } from '../schemas/expense-report.schema';

export class ExpenseItemCreateDto {
  @IsString()
  category: ExpenseCategory;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  receiptFilename?: string;
}

export class ExpenseReportCreateDto {
  @IsString()
  title: string;

  @IsString()
  currency: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemCreateDto)
  items: ExpenseItemCreateDto[];
}
