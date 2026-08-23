import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PayrollConfigUpsertDto } from './dto/payroll-config-upsert.dto';
import { PayrollSummaryResponseDto } from './dto/payroll-summary-response.dto';
import { PayslipCreateDto } from './dto/payslip-create.dto';
import { PayslipResponseDto } from './dto/payslip-response.dto';
import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('summary')
  getSummary(@CurrentEmployee() current: CurrentEmployeeType): Promise<PayrollSummaryResponseDto> {
    return this.payrollService.getSummary(current.tenantId, current.employeeId);
  }

  @Get('payslips')
  getPayslips(@CurrentEmployee() current: CurrentEmployeeType): Promise<PayslipResponseDto[]> {
    return this.payrollService.getPayslips(current.tenantId, current.employeeId);
  }

  @Get('payslips/:id')
  getPayslip(
    @Param('id') id: string,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<PayslipResponseDto> {
    return this.payrollService.getPayslip(id, {
      tenantId: current.tenantId,
      employeeId: current.employeeId,
    });
  }

  /** HR/admin: set or update an employee's payroll configuration */
  @Put('config')
  upsertConfig(
    @Body() dto: PayrollConfigUpsertDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<void> {
    return this.payrollService.upsertConfig(
      current.tenantId,
      current.employeeId,
      current.permissions,
      dto,
    );
  }

  /** HR/admin: issue a payslip for an employee */
  @Post('payslips')
  createPayslip(
    @Body() dto: PayslipCreateDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<PayslipResponseDto> {
    return this.payrollService.createPayslip(current.tenantId, current.permissions, dto);
  }
}
