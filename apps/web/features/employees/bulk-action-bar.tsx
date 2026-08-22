"use client";

import { ArrowRightLeft, Download, UserX, X } from "lucide-react";
import type { Employee } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

interface Props {
  selected: Employee[];
  onClear: () => void;
}

export function BulkActionBar({ selected, onClear }: Props) {
  if (selected.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="shrink-0 text-sm font-medium text-text">
        {selected.length} selected
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Button intent="ghost" size="sm">
          <Download className="mr-1.5 size-3.5" /> Export
        </Button>
        <Button intent="ghost" size="sm">
          <ArrowRightLeft className="mr-1.5 size-3.5" /> Bulk transfer
        </Button>
        <Button intent="ghost" size="sm" className="text-danger hover:text-danger">
          <UserX className="mr-1.5 size-3.5" /> Bulk deactivate
        </Button>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-md p-1 text-text-muted transition-colors hover:text-text"
        aria-label="Clear selection"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
