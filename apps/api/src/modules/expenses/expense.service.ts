import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmployeeRepository } from '../employee/employee.repository';
import { NotificationCategory, NotificationType } from '../notifications/schemas/notification.schema';
import { NotificationService } from '../notifications/notification.service';
import { requirePermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { ExpenseReportCreateDto } from './dto/expense-report-create.dto';
import { ExpenseReportResponseDto } from './dto/expense-report-response.dto';
import { ExpenseRepository } from './expense.repository';
import { ExpenseStatus } from './schemas/expense-report.schema';

interface ActorParams {
  tenantId: string;
  employeeId: string;
  actorPermissions: ReadonlySet<PermissionCode>;
}

@Injectable()
export class ExpenseService {
  constructor(
    private readonly repo: ExpenseRepository,
    private readonly employeeRepo: EmployeeRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async getReports(tenantId: string, employeeId: string): Promise<ExpenseReportResponseDto[]> {
    const docs = await this.repo.findByEmployee(tenantId, employeeId);
    return docs.map(ExpenseReportResponseDto.fromDocument);
  }

  async createReport(
    tenantId: string,
    employeeId: string,
    dto: ExpenseReportCreateDto,
  ): Promise<ExpenseReportResponseDto> {
    const status = dto.status ?? ExpenseStatus.DRAFT;
    const total = dto.items.reduce((sum, item) => sum + item.amount, 0);
    const itemsWithIds = dto.items.map((item) => ({ ...item, id: randomUUID(), status }));

    const doc = await this.repo.create(tenantId, employeeId, {
      title: dto.title,
      submittedAt: status === ExpenseStatus.SUBMITTED ? new Date().toISOString() : undefined,
      status,
      total,
      currency: dto.currency,
      items: itemsWithIds as any,
      notes: dto.notes,
    });

    if (status === ExpenseStatus.SUBMITTED) {
      await this.notifyManagerOnSubmit(tenantId, employeeId, doc.title, doc.currency, total);
    }

    return ExpenseReportResponseDto.fromDocument(doc);
  }

  async submitReport(id: string, actor: ActorParams): Promise<ExpenseReportResponseDto> {
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== actor.tenantId || doc.employeeId.toString() !== actor.employeeId) {
      throw new NotFoundException(`Expense report ${id} not found`);
    }
    if (doc.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be submitted');
    }
    const updated = await this.repo.submit(id);
    await this.notifyManagerOnSubmit(actor.tenantId, actor.employeeId, doc.title, doc.currency, doc.total);
    return ExpenseReportResponseDto.fromDocument(updated!);
  }

  async approveReport(id: string, actor: ActorParams): Promise<ExpenseReportResponseDto> {
    requirePermission(actor.actorPermissions, PermissionCode.EXPENSE_APPROVE);
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== actor.tenantId) {
      throw new NotFoundException(`Expense report ${id} not found`);
    }
    if (doc.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be approved');
    }
    const updated = await this.repo.updateStatus(id, ExpenseStatus.APPROVED, actor.employeeId);
    void this.notificationService.emit({
      tenantId: actor.tenantId,
      recipientId: doc.employeeId.toString(),
      type: NotificationType.EXPENSE,
      category: NotificationCategory.UPDATE,
      title: 'Expense report approved',
      body: `Your expense report "${doc.title}" (${doc.currency} ${doc.total.toFixed(2)}) has been approved.`,
      href: '/expenses',
    });
    return ExpenseReportResponseDto.fromDocument(updated!);
  }

  async rejectReport(id: string, actor: ActorParams): Promise<ExpenseReportResponseDto> {
    requirePermission(actor.actorPermissions, PermissionCode.EXPENSE_APPROVE);
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== actor.tenantId) {
      throw new NotFoundException(`Expense report ${id} not found`);
    }
    if (doc.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be rejected');
    }
    const updated = await this.repo.updateStatus(id, ExpenseStatus.REJECTED, actor.employeeId);
    void this.notificationService.emit({
      tenantId: actor.tenantId,
      recipientId: doc.employeeId.toString(),
      type: NotificationType.EXPENSE,
      category: NotificationCategory.ACTION,
      title: 'Expense report rejected',
      body: `Your expense report "${doc.title}" (${doc.currency} ${doc.total.toFixed(2)}) has been rejected.`,
      href: '/expenses',
    });
    return ExpenseReportResponseDto.fromDocument(updated!);
  }

  async deleteReport(tenantId: string, employeeId: string, id: string): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Expense report ${id} not found`);
    if (doc.tenantId.toString() !== tenantId || doc.employeeId.toString() !== employeeId) {
      throw new NotFoundException(`Expense report ${id} not found`);
    }
    if (doc.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be deleted');
    }
    await this.repo.delete(id);
  }

  private async notifyManagerOnSubmit(
    tenantId: string,
    employeeId: string,
    title: string,
    currency: string,
    total: number,
  ): Promise<void> {
    const employee = await this.employeeRepo.getById(employeeId, tenantId);
    if (!employee?.managerId) return;
    void this.notificationService.emit({
      tenantId,
      recipientId: employee.managerId.toString(),
      type: NotificationType.EXPENSE,
      category: NotificationCategory.ACTION,
      title: 'Expense report awaiting approval',
      body: `${employee.fullName} submitted an expense report: "${title}" (${currency} ${total.toFixed(2)}).`,
      href: '/expenses',
    });
  }
}
