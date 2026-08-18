import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-danger/40 bg-danger/5 p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {onRetry && (
        <Button intent="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
