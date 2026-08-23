import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ExpenseReportCreateDto } from './dto/expense-report-create.dto';
import { ExpenseReportResponseDto } from './dto/expense-report-response.dto';
import { ExpenseService } from './expense.service';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  getReports(@CurrentEmployee() current: CurrentEmployeeType): Promise<ExpenseReportResponseDto[]> {
    return this.expenseService.getReports(current.tenantId, current.employeeId);
  }

  @Post()
  createReport(
    @Body() dto: ExpenseReportCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<ExpenseReportResponseDto> {
    return this.expenseService.createReport(current.tenantId, current.employeeId, dto);
  }

  @Patch(':id/submit')
  submitReport(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<ExpenseReportResponseDto> {
    return this.expenseService.submitReport(id, {
      tenantId: current.tenantId,
      employeeId: current.employeeId,
      actorPermissions: current.permissions,
    });
  }

  @Patch(':id/approve')
  approveReport(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<ExpenseReportResponseDto> {
    return this.expenseService.approveReport(id, {
      tenantId: current.tenantId,
      employeeId: current.employeeId,
      actorPermissions: current.permissions,
    });
  }

  @Patch(':id/reject')
  rejectReport(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<ExpenseReportResponseDto> {
    return this.expenseService.rejectReport(id, {
      tenantId: current.tenantId,
      employeeId: current.employeeId,
      actorPermissions: current.permissions,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  deleteReport(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<void> {
    return this.expenseService.deleteReport(current.tenantId, current.employeeId, id);
  }
}
