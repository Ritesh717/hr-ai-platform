import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RoleCreateDto } from './dto/role-create.dto';
import { RoleListResponseDto, RoleResponseDto } from './dto/role-response.dto';
import { RoleUpdateDto } from './dto/role-update.dto';
import { RoleService } from './role.service';

// Mirrors apps/api/routers/roles.py's roles_router (prefix /api/v1/roles). Thin: extracts
// CurrentEmployee and delegates straight to RoleService — permission checks happen there.
@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async list(@CurrentEmployee() current: CurrentEmployeeType): Promise<RoleListResponseDto> {
    const roles = await this.roleService.listRoles({ tenantId: current.tenantId, actorPermissions: current.permissions });
    return { items: roles.map((r) => RoleResponseDto.fromRole(r)) };
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<RoleResponseDto> {
    const role = await this.roleService.getRole(id, { tenantId: current.tenantId, actorPermissions: current.permissions });
    return RoleResponseDto.fromRole(role);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: RoleCreateDto, @CurrentEmployee() current: CurrentEmployeeType): Promise<RoleResponseDto> {
    const role = await this.roleService.createRole({
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      name: dto.name,
      description: dto.description,
      permissionCodes: dto.permissionCodes,
    });
    return RoleResponseDto.fromRole(role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: RoleUpdateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<RoleResponseDto> {
    const role = await this.roleService.updateRole(id, {
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      name: dto.name,
      description: dto.description,
      permissionCodes: dto.permissionCodes,
    });
    return RoleResponseDto.fromRole(role);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<void> {
    await this.roleService.deleteRole(id, { tenantId: current.tenantId, actorPermissions: current.permissions });
  }
}

// Mirrors apps/api/routers/roles.py's permissions_router (prefix /api/v1/permissions).
@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  list(@CurrentEmployee() current: CurrentEmployeeType) {
    return this.roleService.listPermissionCatalog(current.permissions);
  }
}
