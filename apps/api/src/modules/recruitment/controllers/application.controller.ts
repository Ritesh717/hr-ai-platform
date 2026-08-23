import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../../common/auth/current-employee';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { ApplicationCreateDto, ApplicationResponseDto } from '../dto/application.dto';
import { ApplicationService } from '../services/application.service';

@ApiTags('applications')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get('applications')
  getApplications(@CurrentEmployee() current: CurrentEmployeeType): Promise<ApplicationResponseDto[]> {
    return this.applicationService.getApplications(current.tenantId, current.employeeId);
  }

  @Post('jobs/:jobId/apply')
  apply(
    @Param('jobId') jobId: string,
    @Body() dto: ApplicationCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<ApplicationResponseDto> {
    return this.applicationService.apply(current.tenantId, current.employeeId, jobId, dto);
  }

  @Patch('applications/:id/withdraw')
  @HttpCode(204)
  withdraw(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<void> {
    return this.applicationService.withdraw(current.tenantId, current.employeeId, id);
  }
}
