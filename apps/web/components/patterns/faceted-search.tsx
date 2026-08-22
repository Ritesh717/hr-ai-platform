"use client";

import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface Facet {
  key: string;
  label: string;
  options: string[];
  multiSelect?: boolean;
}

export interface FilterState {
  search: string;
  facets: Record<string, string[]>;
}

interface FacetedSearchProps {
  facets: Facet[];
  onFilter: (filters: FilterState) => void;
  placeholder?: string;
}

export function FacetedSearch({ facets, onFilter, placeholder = "Search…" }: FacetedSearchProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [openFacet, setOpenFacet] = useState<string | null>(null);

  function emit(newSearch: string, newSelected: Record<string, string[]>) {
    onFilter({ search: newSearch, facets: newSelected });
  }

  function handleSearch(value: string) {
    setSearch(value);
    emit(value, selected);
  }

  function toggleOption(facet: Facet, option: string) {
    const current = selected[facet.key] ?? [];
    const next = facet.multiSelect
      ? current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      : current.includes(option)
        ? []
        : [option];
    const newSelected = { ...selected, [facet.key]: next };
    setSelected(newSelected);
    emit(search, newSelected);
  }

  function removeFilter(key: string, option: string) {
    const next = (selected[key] ?? []).filter((o) => o !== option);
    const newSelected = { ...selected, [key]: next };
    setSelected(newSelected);
    emit(search, newSelected);
  }

  function clearAll() {
    setSelected({});
    emit(search, {});
  }

  const activeFilters = Object.entries(selected).flatMap(([key, opts]) =>
    opts.map((opt) => ({ key, opt })),
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Search bar + facet triggers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            placeholder={placeholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {facets.map((facet) => {
          const count = (selected[facet.key] ?? []).length;
          return (
            <Popover
              key={facet.key}
              open={openFacet === facet.key}
              onOpenChange={(open) => setOpenFacet(open ? facet.key : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-chip",
                    count > 0 && "border-primary/40 bg-primary/5 text-primary",
                  )}
                >
                  {facet.label}
                  {count > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                      {count}
                    </span>
                  )}
                  <ChevronDown className="size-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1.5" align="start">
                <div className="max-h-64 overflow-y-auto">
                  {facet.options.map((opt) => {
                    const isSelected = (selected[facet.key] ?? []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleOption(facet, opt)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-chip",
                          isSelected && "bg-primary/10 font-medium text-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "size-3.5 shrink-0 rounded border border-border",
                            isSelected && "border-primary bg-primary",
                          )}
                        />
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map(({ key, opt }) => {
            const facet = facets.find((f) => f.key === key);
            return (
              <span
                key={`${key}:${opt}`}
                className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-primary"
              >
                <span className="text-text-muted">{facet?.label}:</span>&nbsp;{opt}
                <button
                  type="button"
                  onClick={() => removeFilter(key, opt)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                  aria-label={`Remove ${opt}`}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full px-2 py-0.5 text-xs text-text-muted transition-colors hover:text-text"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
