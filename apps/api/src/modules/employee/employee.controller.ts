import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { EmployeeCreateDto } from './dto/employee-create.dto';
import { EmployeeListResponseDto, EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeeUpdateDto } from './dto/employee-update.dto';
import { EmployeeService } from './employee.service';

// Thin controller: extracts CurrentEmployee and delegates straight to EmployeeService.
// Self-access carve-outs and permission checks live in the service, not here.
@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async list(
    @Query() pagination: PaginationQueryDto,
    @Query('search') search: string | undefined,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<EmployeeListResponseDto> {
    const { items, total } = await this.employeeService.listEmployees({
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      offset: pagination.offset,
      limit: pagination.limit,
      search,
    });
    const responses = await Promise.all(
      items.map(async (employee) => {
        const roleName = await this.employeeService.roleNameFor(employee, current.tenantId);
        return EmployeeResponseDto.fromEmployee(employee, roleName);
      }),
    );
    return { items: responses, total };
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<EmployeeResponseDto> {
    const employee = await this.employeeService.getEmployee(id, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
    });
    const roleName = await this.employeeService.roleNameFor(employee, current.tenantId);
    return EmployeeResponseDto.fromEmployee(employee, roleName);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: EmployeeCreateDto, @CurrentEmployee() current: CurrentEmployeeType): Promise<EmployeeResponseDto> {
    const employee = await this.employeeService.createEmployee(dto, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
    });
    const roleName = await this.employeeService.roleNameFor(employee, current.tenantId);
    return EmployeeResponseDto.fromEmployee(employee, roleName);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: EmployeeUpdateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeService.updateEmployee(id, dto, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
    });
    const roleName = await this.employeeService.roleNameFor(employee, current.tenantId);
    return EmployeeResponseDto.fromEmployee(employee, roleName);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<void> {
    await this.employeeService.deleteEmployee(id, {
      tenantId: current.tenantId,
      actorId: current.employeeId,
      actorPermissions: current.permissions,
    });
  }
}
