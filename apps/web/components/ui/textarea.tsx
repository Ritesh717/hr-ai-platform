import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      "flex min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      invalid && "border-danger focus-visible:ring-danger",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
