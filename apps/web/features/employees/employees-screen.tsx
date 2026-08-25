"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Search } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useCreateEmployee, useDepartments, useEmployees } from "@/features/employees/api";
import { BulkActionBar } from "@/features/employees/bulk-action-bar";
import { EmployeeCreateDialog } from "@/features/employees/employee-create-dialog";
import { LifecycleActionMenu } from "@/features/employees/lifecycle-action-menu";
import { NO_DEPARTMENT } from "@/features/employees/schema";
import type { Employee } from "@/lib/api/types";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

// ── Status display ────────────────────────────────────────────────────────────

const STATUS_TONE = {
  active: "success",
  on_leave: "warning",
  terminated: "neutral",
} as const;

const STATUS_LABEL = {
  active: "Active",
  on_leave: "On Leave",
  terminated: "Offboarded",
} as const;

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  employee: Employee;
  deptName: string;
  isSelected: boolean;
  canManage: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
}

function EmployeeRow({
  employee,
  deptName,
  isSelected,
  canManage,
  onToggle,
  onViewProfile,
}: RowProps) {
  return (
    <tr className="group border-b border-border transition-colors last:border-0 hover:bg-bg/50">
      {canManage && (
        <td className="py-3 pl-1 pr-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={`Select ${employee.fullName}`}
          />
        </td>
      )}
      <td className="py-3 pr-4">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={onViewProfile}
        >
          <Avatar name={employee.fullName} size="sm" className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{employee.fullName}</p>
            <p className="truncate text-xs text-text-muted">{employee.email}</p>
          </div>
        </button>
      </td>
      <td className="hidden py-3 pr-4 text-sm text-text-muted md:table-cell">
        {deptName}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-text-muted lg:table-cell">
        {employee.jobTitle}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-text-muted xl:table-cell">
        {fmtDate(employee.hireDate)}
      </td>
      <td className="py-3 pr-4">
        <Badge tone={STATUS_TONE[employee.status]}>{STATUS_LABEL[employee.status]}</Badge>
      </td>
      {canManage && (
        <td className="py-3 text-right">
          <LifecycleActionMenu employee={employee} onViewProfile={onViewProfile} />
        </td>
      )}
    </tr>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function EmployeesScreen() {
  const router = useRouter();
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const createEmployee = useCreateEmployee();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const canManage = currentUser?.permissions.has("employee.write") ?? false;

  const deptMap = useMemo(
    () => Object.fromEntries((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  );

  const filtered = useMemo(() => {
    if (!employees) return [];
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const selectedList = useMemo(
    () => filtered.filter((e) => selected.has(e.id)),
    [filtered, selected],
  );

  const allChecked =
    filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(filtered.map((e) => e.id)));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Employees"
          description={`${employees?.length ?? 0} people across the organization`}
          actions={
            canManage ? (
              <Button onClick={() => setCreating(true)}>
                <PlusCircle className="mr-1.5 size-4" />
                New employee
              </Button>
            ) : undefined
          }
        />

        <Card>
          <CardContent className="flex flex-col gap-4">
            {/* Search toolbar */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search by name, email, or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Bulk action bar (visible when rows are selected) */}
            <BulkActionBar
              selected={selectedList}
              onClear={() => setSelected(new Set())}
            />

            {/* Table */}
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {canManage && (
                        <th className="w-10 pb-2.5 pl-1 pr-3 text-left">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={toggleAll}
                            aria-label="Select all employees"
                          />
                        </th>
                      )}
                      <th className="pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                        Employee
                      </th>
                      <th className="hidden pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted md:table-cell">
                        Department
                      </th>
                      <th className="hidden pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted lg:table-cell">
                        Role
                      </th>
                      <th className="hidden pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted xl:table-cell">
                        Hire date
                      </th>
                      <th className="pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                        Status
                      </th>
                      {canManage && (
                        <th className="w-10 pb-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((employee) => (
                      <EmployeeRow
                        key={employee.id}
                        employee={employee}
                        deptName={
                          employee.departmentId
                            ? (deptMap[employee.departmentId] ?? "—")
                            : "—"
                        }
                        isSelected={selected.has(employee.id)}
                        canManage={canManage}
                        onToggle={() => toggleRow(employee.id)}
                        onViewProfile={() =>
                          router.push(`/employees/${employee.id}`)
                        }
                      />
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="py-10 text-center text-sm text-text-muted">
                    No employees match your search.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="admin" variant="rail" />
      </div>

      {creating && (
        <EmployeeCreateDialog
          departments={departments ?? []}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createEmployee.mutateAsync({
              fullName: values.fullName,
              email: values.email,
              password: values.password,
              jobTitle: values.jobTitle,
              roleId: values.roleId,
              departmentId: values.departmentId === NO_DEPARTMENT ? undefined : values.departmentId,
              hireDate: values.hireDate.toISOString().slice(0, 10),
              location: values.location || undefined,
            });
            push({ title: "Employee created", tone: "success" });
          }}
        />
      )}
    </div>
  );
}
