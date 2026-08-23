import { ExpenseCategory, ExpenseItem, ExpenseReportDocument, ExpenseStatus } from '../schemas/expense-report.schema';

export class ExpenseItemResponseDto {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: ExpenseStatus;
  receiptFilename?: string;
}

export class ExpenseReportResponseDto {
  id: string;
  title: string;
  submittedAt?: string;
  status: ExpenseStatus;
  total: number;
  currency: string;
  items: ExpenseItemResponseDto[];

  static fromDocument(doc: ExpenseReportDocument): ExpenseReportResponseDto {
    return {
      id: (doc._id as any).toString(),
      title: doc.title,
      submittedAt: doc.submittedAt,
      status: doc.status,
      total: doc.total,
      currency: doc.currency,
      items: (doc.items ?? []).map((item: ExpenseItem) => ({
        id: item.id,
        category: item.category,
        description: item.description,
        amount: item.amount,
        currency: item.currency,
        date: item.date,
        status: item.status,
        receiptFilename: item.receiptFilename,
      })),
    };
  }
}
