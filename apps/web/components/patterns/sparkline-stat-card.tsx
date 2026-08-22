"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

interface SparklineStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  sparklineData: number[];
  className?: string;
}

export function SparklineStatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaPositive,
  sparklineData,
  className,
}: SparklineStatCardProps) {
  const chartData = sparklineData.map((v) => ({ v }));

  return (
    <Card className={cn("flex flex-col gap-3 p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        {/* Inline sparkline — no axes */}
        <AreaChart
          width={60}
          height={24}
          data={chartData}
          margin={{ top: 1, right: 1, bottom: 1, left: 1 }}
        >
          <Area
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--primary, 221 83% 53%))"
            fill="hsl(var(--primary, 221 83% 53%))"
            fillOpacity={0.15}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </div>
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      </div>
      {delta !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            deltaPositive ? "text-success" : "text-danger",
          )}
        >
          {deltaPositive ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          {delta}
        </div>
      )}
    </Card>
  );
}
