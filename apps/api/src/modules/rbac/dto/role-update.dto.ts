import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PermissionCode } from '../constants/permission-code.enum';

// All fields optional (PATCH semantics); `permissionCodes: undefined` means "leave unchanged",
// matching RoleUpdate's `permission_codes: list[PermissionCode] | None = None` in schemas.py.
export class RoleUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PermissionCode, { each: true })
  permissionCodes?: PermissionCode[];
}
