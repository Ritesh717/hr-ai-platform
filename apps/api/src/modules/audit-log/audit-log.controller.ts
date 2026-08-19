import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { AuditLogService } from './audit-log.service';
import { AuditLogListResponseDto, AuditLogResponseDto } from './dto/audit-log-response.dto';

// Mirrors apps/api/routers/audit_logs.py (prefix /api/v1/audit-logs). Read-only from the API's
// perspective — writes only happen internally as a side effect of other services.
@Controller('api/v1/audit-logs')
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
