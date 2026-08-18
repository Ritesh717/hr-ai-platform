import { cn } from "@/lib/utils/cn";

export function ProgressStat({
  label,
  value,
  percentage,
  tone = "primary",
  className,
}: {
  label: string;
  value: string;
  percentage: number;
  tone?: "primary" | "success" | "warning" | "info";
  className?: string;
}) {
  const barClass = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-info",
  }[tone];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium text-text">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}
