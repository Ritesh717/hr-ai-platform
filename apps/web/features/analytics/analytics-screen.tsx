"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAnalytics } from "@/lib/api/analytics";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { ChartCard } from "@/components/patterns/chart-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PERIODS = [
  { value: "12m", label: "Last 12 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "3m", label: "Last 3 months" },
];

const CHART_STROKE = "hsl(221 83% 53%)";
const CHART_FILL = "hsl(221 83% 53% / 0.15)";
const CHART_BAR = "hsl(221 83% 53%)";

const PERF_COLORS: Record<string, string> = {
  Exceptional: "hsl(142 71% 45%)",
  Exceeds:     "hsl(221 83% 53%)",
  Meets:       "hsl(199 89% 48%)",
  Developing:  "hsl(38 92% 50%)",
  Below:       "hsl(0 84% 60%)",
};

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--surface, 220 20% 12%))",
  border: "1px solid hsl(var(--border, 220 15% 25%))",
  borderRadius: "8px",
  color: "hsl(var(--text, 220 15% 95%))",
  fontSize: "12px",
};

export function AnalyticsScreen() {
  const [period, setPeriod] = useState("12m");
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    staleTime: 10 * 60 * 1000,
  });

  function slice<T>(arr: T[]): T[] {
    if (period === "3m") return arr.slice(-3);
    if (period === "6m") return arr.slice(-6);
    return arr;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Analytics"
          description="Workforce insights across all domains"
          actions={
            <Button asChild>
              <Link href="/chat">
                <Sparkles className="mr-1.5 size-4" />
                Ask Analytics
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* 1. Headcount trend */}
            <ChartCard
              title="Headcount"
              periods={PERIODS}
              period={period}
              onPeriodChange={setPeriod}
            >
              <LineChart data={slice(data.headcount)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25% / 0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_STROKE}
                  strokeWidth={2}
                  dot={false}
                  name="Headcount"
                />
              </LineChart>
            </ChartCard>

            {/* 2. Attrition rate */}
            <ChartCard
              title="Attrition Rate (%)"
              periods={PERIODS}
              period={period}
              onPeriodChange={setPeriod}
            >
              <AreaChart data={slice(data.attrition)}>
                <defs>
                  <linearGradient id="attrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_STROKE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_STROKE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25% / 0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, "Attrition"]} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_STROKE}
                  strokeWidth={2}
                  fill="url(#attrGrad)"
                  name="Attrition"
                />
              </AreaChart>
            </ChartCard>

            {/* 3. Time to hire */}
            <ChartCard title="Avg. Time to Hire (days)">
              <BarChart data={data.timeToHire} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220 15% 25% / 0.3)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} width={72} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} days`, "Avg days"]} />
                <Bar dataKey="value" fill={CHART_BAR} radius={[0, 4, 4, 0]} name="Days" />
              </BarChart>
            </ChartCard>

            {/* 4. Leave utilization */}
            <ChartCard
              title="Leave Days Taken"
              periods={PERIODS}
              period={period}
              onPeriodChange={setPeriod}
            >
              <AreaChart data={slice(data.leaveUtilization)}>
                <defs>
                  <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25% / 0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} days`, "Days taken"]} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  fill="url(#leaveGrad)"
                  name="Leave days"
                />
              </AreaChart>
            </ChartCard>

            {/* 5. Payroll spend */}
            <ChartCard
              title="Payroll Spend (£M)"
              periods={PERIODS}
              period={period}
              onPeriodChange={setPeriod}
            >
              <AreaChart data={slice(data.payrollSpend)}>
                <defs>
                  <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25% / 0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="M" domain={["auto", "auto"]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`£${v}M`, "Payroll"]} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  fill="url(#payGrad)"
                  name="Payroll"
                />
              </AreaChart>
            </ChartCard>

            {/* 6. Performance distribution */}
            <ChartCard title="Performance Distribution">
              <BarChart data={data.performanceDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25% / 0.3)" />
                <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Employees"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Employees">
                  {data.performanceDist.map((entry) => (
                    <Cell
                      key={entry.rating}
                      fill={PERF_COLORS[entry.rating] ?? CHART_BAR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>
          </div>
        ) : null}
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="analytics" variant="rail" />
      </div>
    </div>
  );
}
