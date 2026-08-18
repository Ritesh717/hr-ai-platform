"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyText = "No results.",
  className,
}: {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          !selected && "text-text-muted",
          className,
        )}
      >
        {selected ? selected.label : placeholder}
        <ChevronsUpDown className="size-4 text-text-muted" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <CommandPrimitive className="flex flex-col">
          <CommandPrimitive.Input
            placeholder={placeholder}
            className="border-b border-border bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted"
          />
          <CommandPrimitive.List className="max-h-64 overflow-y-auto p-1">
            <CommandPrimitive.Empty className="px-3 py-2 text-sm text-text-muted">
              {emptyText}
            </CommandPrimitive.Empty>
            {options.map((option) => (
              <CommandPrimitive.Item
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text data-[selected=true]:bg-bg"
              >
                <Check
                  className={cn(
                    "size-3.5",
                    option.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                {option.label}
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
