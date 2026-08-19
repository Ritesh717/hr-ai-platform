import { RoleDocument } from '../schemas/role.schema';

export class RoleResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  permissions: string[];

  static fromRole(role: RoleDocument): RoleResponseDto {
    return {
      id: role._id.toString(),
      tenantId: role.tenantId.toString(),
      name: role.name,
      description: role.description ?? null,
      permissions: [...role.permissions].sort(),
    };
  }
}

export class RoleListResponseDto {
  items: RoleResponseDto[];
}
