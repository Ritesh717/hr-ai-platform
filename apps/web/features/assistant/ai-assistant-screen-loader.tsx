import { Skeleton } from "@/components/ui/skeleton";

export function AiAssistantScreenLoader() {
  return (
    <div className="flex h-full overflow-hidden rounded-[var(--radius-xl)] border border-glass-border bg-glass-surface shadow-glass-md">
      <div className="hidden w-[280px] shrink-0 border-r border-glass-border p-3 md:flex md:flex-col md:gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
