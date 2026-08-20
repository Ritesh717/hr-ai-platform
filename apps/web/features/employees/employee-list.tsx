"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";
import type { Employee } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusTone = { active: "success", on_leave: "warning", terminated: "danger" } as const;
const statusLabel = { active: "Active", on_leave: "On leave", terminated: "Terminated" } as const;

export const ALL_STATUSES = "all";
export const ALL_TITLES = "all";

export interface EmployeeFilters {
  search: string;
  status: string;
  jobTitle: string;
}

export const defaultEmployeeFilters: EmployeeFilters = {
  search: "",
  status: ALL_STATUSES,
  jobTitle: ALL_TITLES,
};

export function filterEmployees(
  employees: Employee[],
  filters: EmployeeFilters,
  departmentsById: Record<string, string> = {},
): Employee[] {
  const query = filters.search.trim().toLowerCase();
  return employees.filter((employee) => {
    if (filters.status !== ALL_STATUSES && employee.status !== filters.status) return false;
    if (filters.jobTitle !== ALL_TITLES && employee.jobTitle !== filters.jobTitle) return false;
    if (!query) return true;
    const departmentName = employee.departmentId ? departmentsById[employee.departmentId] : "";
    return (
      employee.fullName.toLowerCase().includes(query) ||
      (departmentName ?? "").toLowerCase().includes(query) ||
      employee.jobTitle.toLowerCase().includes(query)
    );
  });
}

export function EmployeeFilterBar({
  employees,
  filters,
  onChange,
  className,
}: {
  employees: Employee[];
  filters: EmployeeFilters;
  onChange: (filters: EmployeeFilters) => void;
  className?: string;
}) {
  const jobTitles = useMemo(
    () => [...new Set(employees.map((employee) => employee.jobTitle))].sort((a, b) => a.localeCompare(b)),
    [employees],
  );

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Search by name, title, or department"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="pl-9"
        />
      </div>

      <Select value={filters.status} onValueChange={(status) => onChange({ ...filters, status })}>
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="on_leave">On leave</SelectItem>
          <SelectItem value="terminated">Terminated</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.jobTitle} onValueChange={(jobTitle) => onChange({ ...filters, jobTitle })}>
        <SelectTrigger className="sm:w-52">
          <SelectValue placeholder="Job title" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TITLES}>All job titles</SelectItem>
          {jobTitles.map((title) => (
            <SelectItem key={title} value={title}>
              {title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EmployeeListRow({ employee, onClick }: { employee: Employee; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left",
        onClick && "cursor-pointer hover:bg-bg",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={employee.fullName} size="sm" />
        <div>
          <p className="text-sm font-medium text-text">{employee.fullName}</p>
          <p className="text-xs text-text-muted">{employee.jobTitle}</p>
        </div>
      </div>
      <Badge tone={statusTone[employee.status]}>{statusLabel[employee.status]}</Badge>
    </button>
  );
}

export function EmployeeGridCard({ employee, onClick }: { employee: Employee; onClick?: () => void }) {
  return (
    <Card
      className={cn("flex h-full flex-col items-center gap-2 p-5 text-center", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <Avatar name={employee.fullName} size="lg" />
      <div>
        <p className="text-sm font-semibold text-text">{employee.fullName}</p>
        <p className="text-xs text-text-muted">{employee.jobTitle}</p>
      </div>
      <Badge tone={statusTone[employee.status]}>{statusLabel[employee.status]}</Badge>
    </Card>
  );
}

export function EmployeeMiniTile({ employee, onClick }: { employee: Employee; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg p-2 text-center",
        onClick && "cursor-pointer hover:bg-bg",
      )}
    >
      <Avatar name={employee.fullName} size="md" />
      <p className="line-clamp-2 text-xs font-medium text-text">{employee.fullName}</p>
    </button>
  );
}
