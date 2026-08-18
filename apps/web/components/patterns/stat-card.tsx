import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-4 p-5", className)}>
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      </div>
      {delta && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            delta.direction === "up" ? "text-success" : "text-danger",
          )}
        >
          {delta.direction === "up" ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          {delta.value}
        </div>
      )}
    </Card>
  );
}
