"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  PlusCircle,
  Receipt,
  Upload,
  X,
} from "lucide-react";
import {
  createExpenseReport,
  fetchExpenseHistory,
  simulateOcrExtraction,
  submitExpenseReport,
} from "@/lib/api/expenses";
import type { ExpenseCategory, ExpenseReport, ExpenseStatus } from "@/lib/api/expenses";
import { useToast } from "@/components/ui/toast";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_TONE: Record<ExpenseStatus, "neutral" | "info" | "success" | "danger" | "warning"> = {
  draft:       "neutral",
  submitted:   "info",
  approved:    "warning",
  rejected:    "danger",
  reimbursed:  "success",
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  draft:      "Draft",
  submitted:  "Submitted",
  approved:   "Approved",
  rejected:   "Rejected",
  reimbursed: "Reimbursed",
};

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "travel",        label: "Travel" },
  { value: "accommodation", label: "Accommodation" },
  { value: "meals",         label: "Meals & Entertainment" },
  { value: "equipment",     label: "Equipment" },
  { value: "training",      label: "Training & Events" },
  { value: "other",         label: "Other" },
];

// ── OCR confirmation step ─────────────────────────────────────────────────────

interface OcrResult {
  vendor: string;
  amount: number;
  date: string;
  confidence: number;
}

interface ReceiptUploadProps {
  onConfirm: (data: { vendor: string; amount: number; date: string }) => void;
  onCancel: () => void;
}

function ReceiptUploadStep({ onConfirm, onCancel }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocr, setOcr] = useState<OcrResult | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setScanning(true);
    setOcr(null);
    try {
      const result = await simulateOcrExtraction(f.name);
      setOcr(result);
    } finally {
      setScanning(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-semibold text-text">Upload receipt</p>
        <p className="mt-0.5 text-sm text-text-muted">
          We'll extract the details automatically. You can review and edit before saving.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <div className="flex items-center gap-2 text-sm text-text">
            <FileText className="size-5 text-primary" />
            <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setOcr(null);
              }}
              className="ml-1 text-text-muted hover:text-danger"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="size-8 text-text-muted" />
            <p className="text-sm text-text-muted">
              Drag & drop or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-text-muted">JPG, PNG, PDF — max 10 MB</p>
          </>
        )}
      </div>

      {/* Scanning / OCR result */}
      {scanning && (
        <div className="flex items-center gap-2 rounded-lg bg-info/10 px-4 py-3 text-sm text-info">
          <Loader2 className="size-4 animate-spin" />
          Scanning receipt…
        </div>
      )}

      {ocr && !scanning && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <p className="text-sm font-medium text-text">
              OCR complete — {Math.round(ocr.confidence * 100)}% confidence
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Vendor</Label>
              <Input defaultValue={ocr.vendor} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Amount (£)</Label>
              <Input type="number" defaultValue={ocr.amount} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" defaultValue={ocr.date} />
            </div>
          </div>
          {ocr.confidence < 0.9 && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertCircle className="size-3.5" />
              Low confidence — please verify the extracted values.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button intent="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={() => onConfirm({ vendor: ocr.vendor, amount: ocr.amount, date: ocr.date })}>
              Use these values
            </Button>
          </div>
        </div>
      )}

      {!file && (
        <div className="flex justify-end">
          <Button intent="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

// ── New expense form ───────────────────────────────────────────────────────────

interface ExpenseDetailsFormProps {
  prefill: { vendor: string; amount: number; date: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

function ExpenseDetailsForm({ prefill, onClose, onSaved }: ExpenseDetailsFormProps) {
  const push = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<ExpenseCategory>("travel");
  const [amount, setAmount] = useState(prefill?.amount?.toString() ?? "");
  const [date, setDate] = useState(prefill?.date ?? "");
  const [vendor, setVendor] = useState(prefill?.vendor ?? "");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(andSubmit: boolean) {
    if (!amount || !date || !vendor) {
      push({ title: "Please fill in amount, date, and vendor", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const title = vendor || `Expense ${date}`;
      const report = await createExpenseReport({
        title,
        currency: "GBP",
        items: [{
          category,
          description: description || vendor,
          amount: parseFloat(amount),
          currency: "GBP",
          date,
        }],
      });
      if (andSubmit) {
        await submitExpenseReport(report.id);
        push({ title: "Expense submitted for approval", description: "Your manager will be notified.", tone: "success" });
      } else {
        push({ title: "Expense saved as draft", tone: "success" });
      }
      void queryClient.invalidateQueries({ queryKey: ["expense-history"] });
      onSaved();
    } catch {
      push({ title: "Failed to save expense", description: "Please try again.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-text">Expense details</p>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Amount (£)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Vendor / merchant</Label>
          <Input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Marriott Hotels"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Description <span className="text-text-subtle">(optional)</span></Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this expense…"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button intent="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button intent="secondary" onClick={() => save(false)} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
          Save as draft
        </Button>
        <Button onClick={() => save(true)} disabled={saving}>
          <Receipt className="mr-1.5 size-4" />
          Submit for approval
        </Button>
      </div>
    </div>
  );
}

interface NewExpenseFormProps {
  onClose: () => void;
}

function NewExpenseForm({ onClose }: NewExpenseFormProps) {
  const [step, setStep] = useState<"upload" | "details">("upload");
  const [prefill, setPrefill] = useState<{ vendor: string; amount: number; date: string } | null>(null);

  if (step === "upload") {
    return (
      <Card className="p-6">
        <ReceiptUploadStep
          onConfirm={(data) => {
            setPrefill(data);
            setStep("details");
          }}
          onCancel={onClose}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <ExpenseDetailsForm prefill={prefill} onClose={onClose} onSaved={onClose} />
    </Card>
  );
}

// ── History table ─────────────────────────────────────────────────────────────

function HistoryCard({ report }: { report: ExpenseReport }) {
  const [open, setOpen] = useState(false);
  const fmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: report.currency });

  return (
    <Card className="flex flex-col">
      <button
        type="button"
        className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-bg/50"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text">{report.title}</p>
          <p className="text-xs text-text-muted">
            {report.submittedAt
              ? new Date(report.submittedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Draft"}
            {" · "}
            {report.items.length} item{report.items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="shrink-0 font-semibold text-text">{fmt.format(report.total)}</span>
        <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-text-muted" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-text-muted" />
        )}
      </button>

      {open && (
        <div className="border-t border-border">
          {report.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-b border-border/50 px-5 py-3 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text">{item.description}</p>
                <p className="text-xs text-text-muted capitalize">{item.category}</p>
              </div>
              <span className="text-sm text-text-muted">{item.date}</span>
              <span className="shrink-0 text-sm font-medium text-text">
                {fmt.format(item.amount)}
              </span>
              {item.receiptFilename && (
                <span title={item.receiptFilename}>
                  <FileText className="size-3.5 shrink-0 text-text-muted" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ExpensesScreen() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["expense-history"],
    queryFn: fetchExpenseHistory,
    staleTime: 5 * 60 * 1000,
  });
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Expenses"
          description="Submit receipts and track reimbursements"
          actions={
            <Button onClick={() => setSubmitting(true)}>
              <PlusCircle className="mr-1.5 size-4" />
              New expense
            </Button>
          }
        />

        {submitting && <NewExpenseForm onClose={() => setSubmitting(false)} />}

        {/* History */}
        <div className="flex flex-col gap-3">
          <h2 className="text-section-heading">Expense history</h2>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : (
            (reports ?? []).map((report) => (
              <HistoryCard key={report.id} report={report} />
            ))
          )}
          {!isLoading && reports?.length === 0 && (
            <Card className="py-12 text-center">
              <p className="text-sm text-text-muted">No expense reports yet.</p>
            </Card>
          )}
        </div>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="payroll" variant="rail" />
      </div>
    </div>
  );
}
