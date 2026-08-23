import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ExpenseReportCreateDto } from './dto/expense-report-create.dto';
import { ExpenseReportResponseDto } from './dto/expense-report-response.dto';
import { ExpenseRepository } from './expense.repository';
import { ExpenseStatus } from './schemas/expense-report.schema';

@Injectable()
export class ExpenseService {
  constructor(private readonly repo: ExpenseRepository) {}

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
      submittedAt: new Date().toISOString(),
      status,
      total,
      currency: dto.currency,
      items: itemsWithIds as any,
      notes: dto.notes,
    });
    return ExpenseReportResponseDto.fromDocument(doc);
  }

  async approveReport(id: string): Promise<ExpenseReportResponseDto> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Expense report ${id} not found`);
    if (doc.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be approved');
    }
    const updated = await this.repo.updateStatus(id, ExpenseStatus.APPROVED);
    return ExpenseReportResponseDto.fromDocument(updated!);
  }

  async rejectReport(id: string): Promise<ExpenseReportResponseDto> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Expense report ${id} not found`);
    if (doc.status !== ExpenseStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be rejected');
    }
    const updated = await this.repo.updateStatus(id, ExpenseStatus.REJECTED);
    return ExpenseReportResponseDto.fromDocument(updated!);
  }

  async deleteReport(tenantId: string, employeeId: string, id: string): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`Expense report ${id} not found`);
    if (
      doc.tenantId.toString() !== tenantId ||
      doc.employeeId.toString() !== employeeId
    ) {
      throw new NotFoundException(`Expense report ${id} not found`);
    }
    if (doc.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be deleted');
    }
    await this.repo.delete(id);
  }
}
