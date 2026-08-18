import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      "flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      invalid && "border-danger focus-visible:ring-danger",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
