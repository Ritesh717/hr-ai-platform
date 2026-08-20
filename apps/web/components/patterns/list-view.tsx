"use client";

import { LayoutGrid, List, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/icon-button";

export type ListViewMode = "list" | "grid" | "minigrid";

const modeOptions: { value: ListViewMode; icon: typeof List; label: string }[] = [
  { value: "list", icon: List, label: "List view" },
  { value: "grid", icon: LayoutGrid, label: "Grid view" },
  { value: "minigrid", icon: Grid3x3, label: "Compact grid view" },
];

export function ViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5", className)}>
      {modeOptions.map((option) => (
        <IconButton
          key={option.value}
          label={option.label}
          intent={value === option.value ? "primary" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
        >
          <option.icon className="size-4" />
        </IconButton>
      ))}
    </div>
  );
}

// Generic list/grid/minigrid switcher — no domain logic. `renderList` takes over entirely for the
// "list" mode (e.g. an existing DataTable), since list rendering (sorting, pagination) varies too
// much per caller to generalize; grid/minigrid are simple item-mapped layouts this component owns.
export function ListView<T>({
  items,
  getKey,
  mode,
  renderList,
  renderGridCard,
  renderMiniTile,
  className,
}: {
  items: T[];
  getKey: (item: T) => string;
  mode: ListViewMode;
  renderList: () => React.ReactNode;
  renderGridCard: (item: T) => React.ReactNode;
  renderMiniTile: (item: T) => React.ReactNode;
  className?: string;
}) {
  if (mode === "list") {
    return <div className={className}>{renderList()}</div>;
  }

  if (mode === "grid") {
    return (
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((item) => (
          <div key={getKey(item)}>{renderGridCard(item)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6", className)}>
      {items.map((item) => (
        <div key={getKey(item)}>{renderMiniTile(item)}</div>
      ))}
    </div>
  );
}
