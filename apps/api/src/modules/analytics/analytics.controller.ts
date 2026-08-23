import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getAnalytics(@CurrentEmployee() current: CurrentEmployeeType): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(current.tenantId, current.permissions);
  }
}
