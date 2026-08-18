"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const RadioGroup = forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
));
RadioGroup.displayName = "RadioGroup";

export const RadioGroupItem = forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-colors",
      "data-[state=checked]:border-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary" />
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = "RadioGroupItem";
