import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PayslipStatus } from '../schemas/payslip.schema';

export class PayBreakdownRowDto {
  @IsString()
  label: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  isDeduction?: boolean;

  @IsOptional()
  isNet?: boolean;
}

export class PayslipCreateDto {
  @IsString()
  employeeId: string;

  @IsString()
  month: string;

  @IsString()
  periodStart: string;

  @IsString()
  periodEnd: string;

  @IsNumber()
  @Min(0)
  grossAmount: number;

  @IsNumber()
  @Min(0)
  netAmount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsEnum(PayslipStatus)
  status?: PayslipStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayBreakdownRowDto)
  breakdown?: PayBreakdownRowDto[];
}
