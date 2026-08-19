import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { EmployeeStatus } from '../schemas/employee.schema';

// All fields optional with no defaults — PATCH semantics. The service reads Object.keys(dto) to
// determine which fields were explicitly present in the request body (class-transformer only
// copies keys that existed in the plain JSON onto the instance), mirroring Pydantic's
// `model_dump(exclude_unset=True)` used by EmployeeUpdate in schemas.py: an omitted key leaves
// the field untouched, distinct from a key explicitly sent.
export class EmployeeUpdateDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsMongoId()
  roleId?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string | null;

  @IsOptional()
  @IsMongoId()
  managerId?: string | null;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsString()
  location?: string | null;
}

export const PRIVILEGED_UPDATE_FIELDS = new Set(['roleId', 'status', 'departmentId', 'managerId']);
