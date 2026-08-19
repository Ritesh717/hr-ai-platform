import { PermissionCode } from '../constants/permission-code.enum';

export class PermissionResponseDto {
  code: PermissionCode;
  description: string | null;

  static fromCode(code: PermissionCode): PermissionResponseDto {
    return { code, description: null };
  }
}
