"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

const sizeClasses = { sm: "size-6 text-[10px]", md: "size-9 text-sm", lg: "size-12 text-base" } as const;

export const Avatar = forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    src?: string | null;
    name: string;
    size?: keyof typeof sizeClasses;
  }
>(({ className, src, name, size = "md", ...props }, ref) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full border-2 border-surface bg-primary/15",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center font-medium text-primary">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = "Avatar";

export function AvatarGroup({
  children,
  max = 4,
  className,
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible}
      {overflow > 0 ? (
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-bg text-xs font-medium text-text-muted">
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
