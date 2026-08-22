"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  gross: number;
  deductions: number;
  net: number;
  currency: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function PayCompositionBar({ gross, deductions, net, currency }: Props) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Defer one frame so the initial 0-width state is painted before we apply the target widths.
    const raf = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const deductionsPct = Math.round((Math.abs(deductions) / gross) * 100);
  const netPct = Math.round((net / gross) * 100);
  // Gross bar is always 100%; the deduction and net bars are overlaid via the legend.

  const segments = [
    {
      label: "Gross",
      amount: gross,
      pct: 100,
      delay: "0ms",
      bar: "bg-primary",
      text: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Deductions",
      amount: Math.abs(deductions),
      pct: deductionsPct,
      delay: "100ms",
      bar: "bg-warning",
      text: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Net pay",
      amount: net,
      pct: netPct,
      delay: "200ms",
      bar: "bg-success",
      text: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Stacked bars */}
      <div className="flex flex-col gap-2 overflow-x-auto">
        {segments.map((seg) => (
          <div key={seg.label} className="flex min-w-[280px] items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-text-muted">{seg.label}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-bg">
              <div
                className={cn("h-full rounded-full", seg.bar)}
                style={{
                  width: animated ? `${seg.pct}%` : "0%",
                  transition: `width 600ms cubic-bezier(0.4,0,0.2,1) ${seg.delay}`,
                }}
              />
            </div>
            <span className={cn("w-20 shrink-0 text-right text-xs font-semibold tabular-nums", seg.text)}>
              {formatCurrency(seg.amount, currency)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs", seg.bg)}>
            <span className={cn("size-2 rounded-full", seg.bar)} />
            <span className={cn("font-medium", seg.text)}>
              {seg.label} — {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
