import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { AuditLogService } from './audit-log.service';
import { AuditLogListResponseDto, AuditLogResponseDto } from './dto/audit-log-response.dto';

// Read-only from the API's perspective — writes only happen internally as a side effect of
// other services (employee create/update/delete, etc.).
@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(
    @Query() pagination: PaginationQueryDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<AuditLogListResponseDto> {
    const { items, total } = await this.auditLogService.listLogs({
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
      offset: pagination.offset,
      limit: pagination.limit,
    });
    return { items: items.map((log) => AuditLogResponseDto.fromDocument(log)), total };
  }
}
