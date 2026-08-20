import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

const surfaceClasses = {
  glass:
    "bg-glass-surface text-text border-glass-border backdrop-blur-glass-md backdrop-saturate-150 shadow-glass-sm transition-shadow hover:shadow-glass-md",
  "glass-strong":
    "bg-glass-surface-strong text-surface-raised-foreground border-glass-border-strong backdrop-blur-glass-lg backdrop-saturate-150 shadow-glass-md",
  solid: "bg-surface text-text border-border shadow-sm",
} as const;

export const Card = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { surface?: keyof typeof surfaceClasses }
>(({ className, surface = "glass", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border", surfaceClasses[surface], className)}
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
