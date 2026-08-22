import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { HolidayCreateDto } from './dto/holiday-create.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';
import { LeaveService } from './leave.service';

@ApiTags('leave')
@ApiBearerAuth()
@Controller('leave/holidays')
@UseGuards(JwtAuthGuard)
export class HolidayController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  async list(@CurrentEmployee() current: CurrentEmployeeType): Promise<HolidayResponseDto[]> {
    const holidays = await this.leaveService.listHolidays(current.tenantId);
    return holidays.map((holiday) => HolidayResponseDto.fromDocument(holiday));
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: HolidayCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<HolidayResponseDto> {
    const holiday = await this.leaveService.createHoliday(dto, {
      tenantId: current.tenantId,
      actorPermissions: current.permissions,
    });
    return HolidayResponseDto.fromDocument(holiday);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentEmployee() current: CurrentEmployeeType): Promise<void> {
    await this.leaveService.deleteHoliday(id, { tenantId: current.tenantId, actorPermissions: current.permissions });
  }
}
