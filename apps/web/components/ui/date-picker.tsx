"use client";

import "react-day-picker/style.css";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
}: {
  value: Date | null;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          !value && "text-text-muted",
          className,
        )}
      >
        {value ? value.toLocaleDateString() : placeholder}
        <CalendarDays className="size-4 text-text-muted" />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        style={
          {
            "--rdp-accent-color": "var(--color-primary)",
            "--rdp-accent-background-color": "color-mix(in srgb, var(--color-primary) 15%, transparent)",
            "--rdp-today-color": "var(--color-primary)",
          } as React.CSSProperties
        }
      >
        <DayPicker
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          className="text-text"
        />
      </PopoverContent>
    </Popover>
  );
}
