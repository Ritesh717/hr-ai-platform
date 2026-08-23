"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LayoutGrid, List, Mail, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  fetchDirectoryEmployees,
  type DirectoryEmployee,
} from "@/lib/api/directory";
import { FacetedSearch, type FilterState } from "@/components/patterns/faceted-search";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_SKILLS = 3;

function getStoredView(): "grid" | "list" {
  try {
    return localStorage.getItem("directory-view-mode") === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

// ── Employee card ─────────────────────────────────────────────────────────────

function EmployeeCard({ employee, view }: { employee: DirectoryEmployee; view: "grid" | "list" }) {
  const [open, setOpen] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function onEnter() {
    enterTimer.current = setTimeout(() => setOpen(true), 350);
  }
  function onLeave() {
    clearTimeout(enterTimer.current);
    setOpen(false);
  }
  function onTouchStart() {
    touchTimer.current = setTimeout(() => setOpen(true), 650);
  }
  function onTouchEnd() {
    clearTimeout(touchTimer.current);
  }

  const shown = employee.skills.slice(0, MAX_SKILLS);
  const extra = employee.skills.length - MAX_SKILLS;

  const skillBadges = (
    <>
      {shown.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
      {extra > 0 && <Badge tone="neutral">+{extra}</Badge>}
    </>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Card
          className={cn(
            "cursor-default select-none transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
            view === "grid" ? "flex flex-col gap-3 p-4" : "flex items-center gap-4 px-4 py-3",
          )}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Avatar name={employee.name} size="lg" className="shrink-0" />
          <div className={cn("min-w-0", view === "list" && "flex-1")}>
            <p className="truncate font-semibold text-text">{employee.name}</p>
            <p className="truncate text-xs text-text-muted">{employee.role}</p>
            <p className="truncate text-xs text-text-muted">{employee.department} · {employee.location}</p>
            {view === "grid" && (
              <div className="mt-2 flex flex-wrap gap-1">{skillBadges}</div>
            )}
          </div>
          {view === "list" && (
            <div className="hidden flex-wrap gap-1 sm:flex">{skillBadges}</div>
          )}
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" side="right" align="start" sideOffset={8}>
        <div className="flex items-start gap-3">
          <Avatar name={employee.name} size="md" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text">{employee.name}</p>
            <p className="text-xs text-text-muted">{employee.role}</p>
            <p className="text-xs text-text-muted">{employee.department}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0" />
            <span>{employee.phone}</span>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button intent="secondary" size="sm" className="flex-1">
            <MessageSquare className="mr-1.5 size-3.5" />
            Message
          </Button>
          <Button intent="secondary" size="sm" className="flex-1">
            <ExternalLink className="mr-1.5 size-3.5" />
            Profile
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function DirectoryScreen() {
  const [view, setView] = useState<"grid" | "list">(getStoredView);
  const [filters, setFilters] = useState<FilterState>({ search: "", facets: {} });

  const { data, isLoading } = useQuery({
    queryKey: ["directory-employees"],
    queryFn: fetchDirectoryEmployees,
    staleTime: 10 * 60 * 1000,
  });

  const facets = useMemo(() => {
    if (!data) return [];
    const uniq = <T,>(arr: T[]) => [...new Set(arr)].sort() as T[];
    return [
      { key: "department", label: "Department", options: uniq(data.map((e) => e.department).filter(Boolean)) },
      { key: "role",       label: "Role",       options: uniq(data.map((e) => e.role).filter(Boolean)) },
      { key: "location",   label: "Location",   options: uniq(data.map((e) => e.location).filter(Boolean)) },
    ];
  }, [data]);

  function handleViewChange(v: "grid" | "list") {
    setView(v);
    try { localStorage.setItem("directory-view-mode", v); } catch { /* ignore */ }
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const { search, facets } = filters;
    return data.filter((emp) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !emp.name.toLowerCase().includes(q) &&
          !emp.role.toLowerCase().includes(q) &&
          !emp.department.toLowerCase().includes(q)
        ) return false;
      }
      if ((facets.department ?? []).length > 0 && !facets.department.includes(emp.department)) return false;
      if ((facets.role ?? []).length > 0 && !facets.role.includes(emp.role)) return false;
      if ((facets.location ?? []).length > 0 && !facets.location.includes(emp.location)) return false;
      if ((facets.skills ?? []).length > 0 && !facets.skills.some((s) => emp.skills.includes(s))) return false;
      return true;
    });
  }, [data, filters]);

  const gridCls = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3";
  const listCls = "flex flex-col gap-2";

  return (
    <div className="flex flex-col gap-5">
      {/* Faceted search */}
      <FacetedSearch
        facets={facets}
        onFilter={setFilters}
        placeholder="Search by name, role, or department…"
      />

      {/* Count + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {isLoading
            ? "Loading…"
            : `Showing ${filtered.length} of ${data?.length ?? 0} employees`}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleViewChange(v)}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                view === v ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text",
              )}
              aria-label={`${v === "grid" ? "Grid" : "List"} view`}
            >
              {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className={view === "grid" ? gridCls : listCls}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className={cn("w-full rounded-xl", view === "grid" ? "h-40" : "h-16")} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-medium text-text">No employees found</p>
          <p className="text-sm text-text-muted">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className={view === "grid" ? gridCls : listCls}>
          {filtered.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
