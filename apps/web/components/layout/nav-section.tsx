import { cn } from "@/lib/utils/cn";

export function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {!collapsed && (
        <div className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted/70">
          {title}
        </div>
      )}
      <div className={cn("flex flex-col gap-1", collapsed && "items-center")}>
        {children}
      </div>
    </div>
  );
}
