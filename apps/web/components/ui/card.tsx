import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Card = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { raised?: boolean }
>(({ className, raised, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border shadow-sm",
      raised
        ? "bg-surface-raised text-surface-raised-foreground border-transparent"
        : "bg-surface text-text",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between gap-4 p-5 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";
