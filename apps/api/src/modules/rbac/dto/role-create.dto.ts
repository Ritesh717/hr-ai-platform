import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PermissionCode } from '../constants/permission-code.enum';

export class RoleCreateDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PermissionCode, { each: true })
  permissionCodes: PermissionCode[] = [];
}
