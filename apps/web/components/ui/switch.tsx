"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Switch = forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-6 w-11 shrink-0 rounded-full bg-border transition-colors",
      "data-[state=checked]:bg-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform",
        "data-[state=checked]:translate-x-5",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
