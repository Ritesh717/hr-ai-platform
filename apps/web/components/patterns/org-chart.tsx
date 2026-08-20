"use client";

import type { Employee } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";

function buildImmediateContext(employees: Employee[], currentUserId: string) {
  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  const me = byId.get(currentUserId) ?? null;
  if (!me) return { manager: null, peers: [] as Employee[], me: null, reports: [] as Employee[] };

  const manager = me.managerId ? (byId.get(me.managerId) ?? null) : null;
  const peers = employees.filter(
    (employee) => employee.id !== me.id && me.managerId !== null && employee.managerId === me.managerId,
  );
  const reports = employees.filter((employee) => employee.managerId === me.id);

  return { manager, peers, me, reports };
}

function OrgChartRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <div className="flex flex-wrap justify-center gap-4">{children}</div>
    </div>
  );
}

function OrgChartNode({
  employee,
  highlighted,
  onSelect,
}: {
  employee: Employee;
  highlighted?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg p-2 text-center",
        highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
        onSelect && "cursor-pointer hover:bg-bg",
      )}
    >
      <Avatar name={employee.fullName} size={highlighted ? "lg" : "md"} />
      <div>
        <p className={cn("text-sm", highlighted ? "font-semibold text-text" : "font-medium text-text")}>
          {employee.fullName}
        </p>
        <p className="text-xs text-text-muted">{employee.jobTitle}</p>
      </div>
    </button>
  );
}

// Renders the current user's immediate org context (manager above, self highlighted among peers,
// direct reports below) derived client-side from a flat Employee[] via managerId — not the full
// company tree, and not backed by a dedicated org-chart endpoint.
export function OrgChart({
  employees,
  currentUserId,
  onSelect,
  className,
}: {
  employees: Employee[];
  currentUserId: string;
  onSelect?: (employee: Employee) => void;
  className?: string;
}) {
  const { manager, peers, me, reports } = buildImmediateContext(employees, currentUserId);
  if (!me) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {manager && (
        <OrgChartRow label="Manager">
          <OrgChartNode employee={manager} onSelect={onSelect && (() => onSelect(manager))} />
        </OrgChartRow>
      )}

      <OrgChartRow label="You & peers">
        <OrgChartNode employee={me} highlighted />
        {peers.map((peer) => (
          <OrgChartNode key={peer.id} employee={peer} onSelect={onSelect && (() => onSelect(peer))} />
        ))}
      </OrgChartRow>

      {reports.length > 0 && (
        <OrgChartRow label="Direct reports">
          {reports.map((report) => (
            <OrgChartNode key={report.id} employee={report} onSelect={onSelect && (() => onSelect(report))} />
          ))}
        </OrgChartRow>
      )}
    </div>
  );
}
