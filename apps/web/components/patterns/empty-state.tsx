import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-bg text-text-muted">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {action && (
        <Button intent="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
