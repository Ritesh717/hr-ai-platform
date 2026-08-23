import { apiFetch } from "./client";

export type ExpenseCategory =
  | "travel"
  | "accommodation"
  | "meals"
  | "equipment"
  | "training"
  | "other";

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "reimbursed";

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: ExpenseStatus;
  receiptFilename?: string;
  /** OCR result surfaced after upload */
  ocrResult?: {
    vendor: string;
    amount: number;
    date: string;
    confidence: number;
  };
}

export interface ExpenseReport {
  id: string;
  title: string;
  submittedAt?: string;
  status: ExpenseStatus;
  total: number;
  currency: string;
  items: ExpenseItem[];
}

export interface ExpenseReportCreatePayload {
  title: string;
  currency: string;
  status?: ExpenseStatus;
  notes?: string;
  items: Omit<ExpenseItem, "id" | "status" | "ocrResult">[];
}

export async function fetchExpenseHistory(): Promise<ExpenseReport[]> {
  return apiFetch<ExpenseReport[]>("/api/v1/expenses");
}

export async function createExpenseReport(payload: ExpenseReportCreatePayload): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>("/api/v1/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitExpenseReport(id: string): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>(`/api/v1/expenses/${id}/submit`, { method: "PATCH" });
}

export async function fetchPendingExpenseApprovals(): Promise<ExpenseReport[]> {
  return apiFetch<ExpenseReport[]>("/api/v1/expenses/pending-approval");
}

export async function approveExpenseReport(id: string): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>(`/api/v1/expenses/${id}/approve`, { method: "PATCH" });
}

export async function rejectExpenseReport(id: string): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>(`/api/v1/expenses/${id}/reject`, { method: "PATCH" });
}

export async function deleteExpenseReport(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/expenses/${id}`, { method: "DELETE" });
}

/** Simulates server-side OCR extraction. OCR integration is a stretch goal (INT-9.2). */
export async function simulateOcrExtraction(filename: string): Promise<{
  vendor: string;
  amount: number;
  date: string;
  confidence: number;
}> {
  await new Promise((r) => setTimeout(r, 1500));
  const seed = filename.length;
  return {
    vendor: ["Marriott Hotels", "Lufthansa", "Uber", "Eventbrite", "Amazon"][seed % 5],
    amount: [120, 340, 45, 600, 89][seed % 5],
    date: "2026-08-20",
    confidence: 0.88 + (seed % 5) * 0.02,
  };
}
