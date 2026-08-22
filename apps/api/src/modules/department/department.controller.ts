import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { DepartmentCreateDto } from './dto/department-create.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { DepartmentUpdateDto } from './dto/department-update.dto';
import { DepartmentService } from './department.service';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  async list(
    @Query() pagination: PaginationQueryDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<DepartmentResponseDto[]> {
    const departments = await this.departmentService.listDepartments({
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      offset: pagination.offset,
      limit: pagination.limit,
    });
    return departments.map((d) => DepartmentResponseDto.fromDocument(d));
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<DepartmentResponseDto> {
    const department = await this.departmentService.getDepartment(id, {
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
    });
    return DepartmentResponseDto.fromDocument(department);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: DepartmentCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<DepartmentResponseDto> {
    const department = await this.departmentService.createDepartment({
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      name: dto.name,
    });
    return DepartmentResponseDto.fromDocument(department);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: DepartmentUpdateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<DepartmentResponseDto> {
    const department = await this.departmentService.updateDepartment(id, {
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      name: dto.name,
    });
    return DepartmentResponseDto.fromDocument(department);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<void> {
    await this.departmentService.deleteDepartment(id, {
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
    });
  }
}
