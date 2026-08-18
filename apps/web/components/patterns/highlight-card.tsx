import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

export function HighlightCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card raised className={cn("flex flex-col gap-4 p-5", className)}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}
