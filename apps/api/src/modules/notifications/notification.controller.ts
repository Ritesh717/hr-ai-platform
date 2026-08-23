import { Controller, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getNotifications(
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationService.getNotifications(current.tenantId, current.employeeId);
  }

  /** Must be declared before :id routes to avoid being shadowed by parameter matching */
  @Patch('read-all')
  @HttpCode(204)
  markAllRead(@CurrentEmployee() current: CurrentEmployeeType): Promise<void> {
    return this.notificationService.markAllRead(current.tenantId, current.employeeId);
  }

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markRead(current.tenantId, current.employeeId, id);
  }

  @Patch(':id/dismiss')
  @HttpCode(204)
  dismiss(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<void> {
    return this.notificationService.dismiss(current.tenantId, current.employeeId, id);
  }
}
