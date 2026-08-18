"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center shrink-0 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-surface text-text border border-border hover:bg-bg",
        ghost: "text-text-muted hover:bg-surface hover:text-text",
        destructive: "bg-danger text-danger-foreground hover:opacity-90",
      },
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
      },
    },
    defaultVariants: { intent: "ghost", size: "md" },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, intent, size, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ intent, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
