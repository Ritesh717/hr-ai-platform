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
  date: string; // ISO date
  status: ExpenseStatus;
  receiptFilename?: string;
  /** Simulated OCR result surfaced after upload */
  ocrResult?: {
    vendor: string;
    amount: number;
    date: string;
    confidence: number; // 0–1
  };
}

export interface ExpenseReport {
  id: string;
  title: string;
  submittedAt: string;
  status: ExpenseStatus;
  total: number;
  currency: string;
  items: ExpenseItem[];
}

export async function fetchExpenseHistory(): Promise<ExpenseReport[]> {
  await new Promise((r) => setTimeout(r, 180));
  return [
    {
      id: "r1",
      title: "KubeCon EU 2026",
      submittedAt: "2026-08-19T16:30:00Z",
      status: "submitted",
      total: 840,
      currency: "GBP",
      items: [
        {
          id: "i1",
          category: "training",
          description: "Conference registration",
          amount: 600,
          currency: "GBP",
          date: "2026-07-15",
          status: "submitted",
          receiptFilename: "kubecon-reg.pdf",
        },
        {
          id: "i2",
          category: "travel",
          description: "Return flights",
          amount: 240,
          currency: "GBP",
          date: "2026-07-20",
          status: "submitted",
          receiptFilename: "flights.pdf",
        },
      ],
    },
    {
      id: "r2",
      title: "Client visit — Berlin",
      submittedAt: "2026-07-10T09:00:00Z",
      status: "reimbursed",
      total: 520,
      currency: "GBP",
      items: [
        {
          id: "i3",
          category: "travel",
          description: "Eurostar return",
          amount: 310,
          currency: "GBP",
          date: "2026-06-25",
          status: "reimbursed",
        },
        {
          id: "i4",
          category: "accommodation",
          description: "Hotel (2 nights)",
          amount: 210,
          currency: "GBP",
          date: "2026-06-26",
          status: "reimbursed",
        },
      ],
    },
    {
      id: "r3",
      title: "Team off-site meals",
      submittedAt: "2026-06-20T14:00:00Z",
      status: "approved",
      total: 185,
      currency: "GBP",
      items: [
        {
          id: "i5",
          category: "meals",
          description: "Team dinner",
          amount: 185,
          currency: "GBP",
          date: "2026-06-18",
          status: "approved",
          receiptFilename: "dinner-receipt.jpg",
        },
      ],
    },
  ];
}

/** Simulates server-side OCR extraction (150ms latency). */
export async function simulateOcrExtraction(filename: string): Promise<{
  vendor: string;
  amount: number;
  date: string;
  confidence: number;
}> {
  await new Promise((r) => setTimeout(r, 1500));
  // Deterministic mock based on filename length
  const seed = filename.length;
  return {
    vendor: ["Marriott Hotels", "Lufthansa", "Uber", "Eventbrite", "Amazon"][seed % 5],
    amount: [120, 340, 45, 600, 89][seed % 5],
    date: "2026-08-20",
    confidence: 0.88 + (seed % 5) * 0.02,
  };
}
