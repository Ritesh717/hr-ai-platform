import { Injectable, NotFoundException } from '@nestjs/common';
import { requirePermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { PayrollConfigUpsertDto } from './dto/payroll-config-upsert.dto';
import { PayrollSummaryResponseDto } from './dto/payroll-summary-response.dto';
import { PayslipCreateDto } from './dto/payslip-create.dto';
import { PayslipResponseDto } from './dto/payslip-response.dto';
import { PayrollConfigRepository } from './payroll-config.repository';
import { PayslipRepository } from './payslip.repository';

@Injectable()
export class PayrollService {
  constructor(
    private readonly configRepo: PayrollConfigRepository,
    private readonly payslipRepo: PayslipRepository,
  ) {}

  async getSummary(tenantId: string, employeeId: string): Promise<PayrollSummaryResponseDto> {
    const config = await this.configRepo.findByEmployee(tenantId, employeeId);
    const latest = await this.payslipRepo.findLatestByEmployee(tenantId, employeeId);
    const ytdEarnings = await this.payslipRepo.sumYtdEarnings(
      tenantId,
      employeeId,
      new Date().getFullYear(),
    );

    const grossSalary = config?.grossSalary ?? 0;
    // The latest payslip's own net amount is the caller's actual latest net pay — scaling it by
    // the config's current annual grossSalary silently drifted from reality whenever the two
    // diverged (e.g. after a raise the config wasn't retroactively applied to old payslips).
    const netSalary = latest ? latest.netAmount : grossSalary * 0.71;

    return {
      grossSalary,
      netSalary: Math.round(netSalary),
      currency: config?.currency ?? 'GBP',
      nextPayDate: config?.nextPayDate ?? '',
      employmentType: config?.employmentType ?? 'Full-time' as any,
      ytdEarnings,
      breakdown: latest?.breakdown ?? [],
    };
  }

  async getPayslips(tenantId: string, employeeId: string): Promise<PayslipResponseDto[]> {
    const docs = await this.payslipRepo.findByEmployee(tenantId, employeeId);
    return docs.map(PayslipResponseDto.fromDocument);
  }

  async getPayslip(
    id: string,
    actor: { tenantId: string; employeeId: string },
  ): Promise<PayslipResponseDto> {
    const doc = await this.payslipRepo.findById(id);
    if (
      !doc ||
      doc.tenantId.toString() !== actor.tenantId ||
      doc.employeeId.toString() !== actor.employeeId
    ) {
      throw new NotFoundException(`Payslip ${id} not found`);
    }
    return PayslipResponseDto.fromDocument(doc);
  }

  async upsertConfig(
    tenantId: string,
    employeeId: string,
    actorPermissions: ReadonlySet<PermissionCode>,
    dto: PayrollConfigUpsertDto,
  ): Promise<void> {
    requirePermission(actorPermissions, PermissionCode.PAYROLL_MANAGE);
    await this.configRepo.upsert(tenantId, employeeId, {
      grossSalary: dto.grossSalary,
      currency: dto.currency,
      employmentType: dto.employmentType,
      nextPayDate: dto.nextPayDate,
    });
  }

  async createPayslip(
    tenantId: string,
    actorPermissions: ReadonlySet<PermissionCode>,
    dto: PayslipCreateDto,
  ): Promise<PayslipResponseDto> {
    requirePermission(actorPermissions, PermissionCode.PAYROLL_MANAGE);
    const doc = await this.payslipRepo.create(tenantId, {
      employeeId: dto.employeeId,
      month: dto.month,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      grossAmount: dto.grossAmount,
      netAmount: dto.netAmount,
      currency: dto.currency,
      status: dto.status ?? 'Processing' as any,
      breakdown: dto.breakdown ?? [],
    });
    return PayslipResponseDto.fromDocument(doc);
  }
}
