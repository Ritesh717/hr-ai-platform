"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartCard } from "./chart-card";
import type { SkillPoint } from "@/lib/api/careers";

const CURRENT_COLOR = (current: number, target: number) => {
  if (current >= target) return "hsl(142 71% 45%)";    // success/green
  if (current >= target - 15) return "hsl(38 92% 50%)"; // warning/amber
  return "hsl(4 86% 58%)";                              // danger/red
};

const TARGET_COLOR = "hsl(var(--color-border, 215 14% 34%))";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface p-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-text">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-text-muted">
          {p.name}: <span className="font-medium text-text">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

interface Props {
  skills: SkillPoint[];
  targetRole: string;
}

export function SkillsGapChart({ skills, targetRole }: Props) {
  return (
    <ChartCard title={`Skills gap · ${targetRole}`} height={280}>
      <BarChart
        data={skills}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
        barCategoryGap="30%"
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(215 14% 30% / 0.2)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]} maxBarSize={14}>
          {skills.map((entry) => (
            <Cell key={entry.skill} fill={CURRENT_COLOR(entry.current, entry.target)} />
          ))}
        </Bar>
        <Bar dataKey="target" name="Target" fill={TARGET_COLOR} radius={[0, 4, 4, 0]} maxBarSize={14} opacity={0.4} />
      </BarChart>
    </ChartCard>
  );
}
