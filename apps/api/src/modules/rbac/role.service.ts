import { Injectable } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { ConflictError, NotFoundError } from '../../common/errors/app.error';
import { EmployeeRepository } from '../employee/employee.repository';
import { requirePermission } from './authorization';
import { ALL_PERMISSION_CODES, PermissionCode, RoleName } from './constants/permission-code.enum';
import { DEFAULT_ROLE_TEMPLATES } from './constants/default-role-templates';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { RoleRepository } from './role.repository';
import { RoleDocument } from './schemas/role.schema';

// Mirrors domain/rbac/service.py's RoleService.
@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async listRoles(params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> }): Promise<RoleDocument[]> {
    requirePermission(params.actorPermissions, PermissionCode.RBAC_MANAGE);
    return this.roleRepository.listRoles(params.tenantId);
  }

  async getRole(
    roleId: string,
    params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> },
  ): Promise<RoleDocument> {
    requirePermission(params.actorPermissions, PermissionCode.RBAC_MANAGE);
    const role = await this.roleRepository.getById(roleId, params.tenantId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);
    return role;
  }

  // Tenant-agnostic global catalog — served statically from the enum, no DB round trip.
  listPermissionCatalog(actorPermissions: ReadonlySet<PermissionCode>): PermissionResponseDto[] {
    requirePermission(actorPermissions, PermissionCode.RBAC_MANAGE);
    return ALL_PERMISSION_CODES.map((code) => PermissionResponseDto.fromCode(code));
  }

  async createRole(params: {
    tenantId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    name: string;
    description?: string;
    permissionCodes: PermissionCode[];
  }): Promise<RoleDocument> {
    const { tenantId, actorPermissions, name, description, permissionCodes } = params;
    requirePermission(actorPermissions, PermissionCode.RBAC_MANAGE);

    const existing = await this.roleRepository.getByName(name, tenantId);
    if (existing) throw new ConflictError(`Role '${name}' already exists`);

    return this.roleRepository.create({
      tenantId: new Types.ObjectId(tenantId),
      name,
      description,
      permissions: permissionCodes,
    });
  }

  async updateRole(
    roleId: string,
    params: {
      tenantId: string;
      actorPermissions: ReadonlySet<PermissionCode>;
      name?: string;
      description?: string;
      permissionCodes?: PermissionCode[];
    },
  ): Promise<RoleDocument> {
    const { tenantId, actorPermissions, name, description, permissionCodes } = params;
    requirePermission(actorPermissions, PermissionCode.RBAC_MANAGE);

    const role = await this.roleRepository.getById(roleId, tenantId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);

    if (name !== undefined && name !== role.name) {
      const other = await this.roleRepository.getByName(name, tenantId);
      if (other) throw new ConflictError(`Role '${name}' already exists`);
    }

    // The self-lockout guard: if this edit would strip RBAC_MANAGE from the role, make sure at
    // least one other employee in the tenant would still hold it via a different role.
    if (permissionCodes !== undefined) {
      const currentlyGrantsManage = role.permissions.includes(PermissionCode.RBAC_MANAGE);
      const willGrantManage = permissionCodes.includes(PermissionCode.RBAC_MANAGE);
      if (currentlyGrantsManage && !willGrantManage) {
        const otherHolders = await this.employeeRepository.countByPermissionCode({
          permission: PermissionCode.RBAC_MANAGE,
          tenantId,
          excludingRoleId: role._id,
        });
        if (otherHolders === 0) {
          throw new ConflictError('This change would leave the tenant with no one able to manage roles');
        }
      }
    }

    return this.roleRepository.update(role, { name, description, permissions: permissionCodes });
  }

  async deleteRole(roleId: string, params: { tenantId: string; actorPermissions: ReadonlySet<PermissionCode> }): Promise<void> {
    requirePermission(params.actorPermissions, PermissionCode.RBAC_MANAGE);
    const role = await this.roleRepository.getById(roleId, params.tenantId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);

    const inUseCount = await this.employeeRepository.countByRoleId(role._id, params.tenantId);
    if (inUseCount > 0) {
      throw new ConflictError('Cannot delete a role that is still assigned to employees');
    }
    await this.roleRepository.delete(role);
  }

  // System-level, no actorPermissions param — only callable from TenantService.bootstrap and
  // test fixtures, never HTTP-reachable. Mirrors RoleService.seed_default_roles.
  async seedDefaultRoles(tenantId: Types.ObjectId, session?: ClientSession): Promise<Record<RoleName, RoleDocument>> {
    const entries = await Promise.all(
      (Object.values(RoleName) as RoleName[]).map(async (roleName) => {
        const role = await this.roleRepository.create(
          {
            tenantId,
            name: roleName,
            permissions: DEFAULT_ROLE_TEMPLATES[roleName],
          },
          session,
        );
        return [roleName, role] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<RoleName, RoleDocument>;
  }
}
