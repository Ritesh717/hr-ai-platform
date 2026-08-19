import { IsDateString, IsEmail, IsEnum, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { EmployeeStatus } from '../schemas/employee.schema';

export class EmployeeCreateDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  jobTitle: string;

  @IsMongoId()
  roleId: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus = EmployeeStatus.ACTIVE;

  @IsDateString()
  hireDate: string;

  @IsOptional()
  @IsString()
  location?: string;
}
