import { Controller, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../../common/auth/current-employee';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { InterviewResponseDto } from '../dto/interview.dto';
import { InterviewService } from '../services/interview.service';

@ApiTags('interviews')
@ApiBearerAuth()
@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  getInterviews(@CurrentEmployee() current: CurrentEmployeeType): Promise<InterviewResponseDto[]> {
    return this.interviewService.getInterviews(current.tenantId, current.employeeId);
  }

  @Patch(':id/cancel')
  @HttpCode(204)
  cancel(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<void> {
    return this.interviewService.cancel(current.tenantId, current.employeeId, id);
  }
}
