import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../../common/auth/current-employee';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { JobCreateDto, JobResponseDto } from '../dto/job.dto';
import { JobService } from '../services/job.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  getJobs(@CurrentEmployee() current: CurrentEmployeeType): Promise<JobResponseDto[]> {
    return this.jobService.getOpenJobs(current.tenantId);
  }

  @Get(':id')
  getJob(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<JobResponseDto> {
    return this.jobService.getJobById(current.tenantId, id);
  }

  @Post()
  createJob(
    @Body() dto: JobCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<JobResponseDto> {
    return this.jobService.createJob(current.tenantId, dto, current.permissions);
  }
}
