import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PayslipDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button intent="ghost" size="sm" asChild>
          <Link href="/payroll">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to payroll
          </Link>
        </Button>
      </div>
      <Card className="flex flex-col gap-4 p-6">
        <h1 className="text-page-title">Payslip Detail</h1>
        <p className="text-sm text-text-muted">
          Payslip <span className="font-mono text-text">{params.id}</span>
        </p>
        <p className="text-sm text-text-subtle">
          Full payslip document view will be available in Stage 5.
        </p>
      </Card>
    </div>
  );
}
