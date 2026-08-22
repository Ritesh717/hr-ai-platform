"use client";

import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useAuditLogs } from "@/features/audit-log/api";
import { usePermissions, useRoles } from "@/features/roles/api";
import { getRoleColumns } from "@/features/roles/columns";
import { RoleFormDialog } from "@/features/roles/role-form-dialog";
import {
  useCreateRole,
  useDeleteRole,
  useUpdateRole,
} from "@/features/roles/api";
import type { Role } from "@/lib/api/types";
import type { PermissionCode } from "@/lib/api/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { DataTable } from "@/components/patterns/data-table";
import { ErrorState } from "@/components/patterns/error-state";

// ── Permission groups for the access matrix ────────────────────────────────────

const PERM_GROUPS: { label: string; codes: PermissionCode[] }[] = [
  {
    label: "Employee",
    codes: ["employee.read", "employee.write", "employee.delete"],
  },
  {
    label: "Department",
    codes: ["department.read", "department.write"],
  },
  {
    label: "Leave",
    codes: ["leave.read", "leave.approve", "leave.manage"],
  },
  {
    label: "RBAC",
    codes: ["rbac.manage"],
  },
  {
    label: "Audit",
    codes: ["audit_log.read"],
  },
];

const PERM_LABEL: Record<PermissionCode, string> = {
  "employee.read":   "Read",
  "employee.write":  "Write",
  "employee.delete": "Delete",
  "department.read": "Read",
  "department.write":"Write",
  "leave.read":      "Read",
  "leave.approve":   "Approve",
  "leave.manage":    "Manage",
  "rbac.manage":     "Manage",
  "audit_log.read":  "Read",
};

// ── Approval hierarchy data ────────────────────────────────────────────────────

interface ApprovalStep {
  label: string;
  badge?: string;
}

interface ApprovalChain {
  type: string;
  description: string;
  steps: ApprovalStep[];
  note?: string;
}

const APPROVAL_CHAINS: ApprovalChain[] = [
  {
    type: "Leave Request",
    description: "Standard time-off and annual leave",
    steps: [
      { label: "Employee" },
      { label: "Direct Manager", badge: "leave.approve" },
      { label: "HR Manager", badge: "leave.manage" },
    ],
    note: "HR Manager step only triggered for requests > 10 consecutive days.",
  },
  {
    type: "Offboarding",
    description: "Employee departure and access revocation",
    steps: [
      { label: "HR Admin", badge: "employee.write" },
      { label: "Department Head" },
      { label: "CEO", badge: "rbac.manage" },
    ],
    note: "CEO sign-off required for VP-level and above.",
  },
  {
    type: "Role Assignment",
    description: "Granting or revoking platform roles",
    steps: [
      { label: "Requester" },
      { label: "RBAC Admin", badge: "rbac.manage" },
    ],
    note: "All role changes are recorded in the audit log.",
  },
  {
    type: "Expense Report",
    description: "Employee expense submission and reimbursement",
    steps: [
      { label: "Employee" },
      { label: "Direct Manager", badge: "leave.approve" },
      { label: "Finance Admin" },
    ],
  },
];

// ── Access matrix tab ──────────────────────────────────────────────────────────

function AccessMatrixTab({ canManage }: { canManage: boolean }) {
  const { data: roles, isLoading: rolesLoading } = useRoles();

  if (rolesLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!roles?.length) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        No roles defined yet. Create a role first.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="w-40 pb-3 pr-4 text-left text-sm font-medium text-text-muted">Role</th>
            {PERM_GROUPS.map((group) => (
              <th
                key={group.label}
                colSpan={group.codes.length}
                className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {group.label}
              </th>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th className="pb-2" />
            {PERM_GROUPS.flatMap((group) =>
              group.codes.map((code) => (
                <th
                  key={code}
                  className="pb-2 px-2 text-center font-normal text-text-muted"
                >
                  {PERM_LABEL[code]}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {roles.map((role) => (
            <tr key={role.id} className="hover:bg-bg/50">
              <td className="py-3 pr-4">
                <p className="font-medium text-text">{role.name}</p>
                {role.description && (
                  <p className="text-text-muted">{role.description}</p>
                )}
              </td>
              {PERM_GROUPS.flatMap((group) =>
                group.codes.map((code) => {
                  const has = role.permissions.includes(code);
                  return (
                    <td key={code} className="py-3 px-2 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={has}
                          disabled={!canManage}
                          aria-label={`${role.name} — ${code}`}
                        />
                      </div>
                    </td>
                  );
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Approval hierarchy tab ─────────────────────────────────────────────────────

function ApprovalHierarchyTab() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {APPROVAL_CHAINS.map((chain) => (
        <Card key={chain.type} className="flex flex-col gap-4 p-5">
          <div>
            <p className="font-semibold text-text">{chain.type}</p>
            <p className="mt-0.5 text-xs text-text-muted">{chain.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {chain.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-chip px-3 py-2">
                  <span className="text-xs font-medium text-text">{step.label}</span>
                  {step.badge && (
                    <Badge tone="neutral" className="text-[10px]">
                      {step.badge}
                    </Badge>
                  )}
                </div>
                {i < chain.steps.length - 1 && (
                  <ChevronRight className="size-4 shrink-0 text-text-muted" />
                )}
              </div>
            ))}
          </div>
          {chain.note && (
            <p className="rounded-md bg-info/10 px-3 py-2 text-xs text-info">
              {chain.note}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── Audit log tab ──────────────────────────────────────────────────────────────

function AuditLogTab() {
  const { data, isLoading, isError, refetch } = useAuditLogs();

  const rbacItems = (data?.items ?? [])
    .filter(
      (log) =>
        log.action.startsWith("rbac") ||
        log.resourceType === "role" ||
        log.resourceType === "permission",
    )
    .slice(0, 20);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Couldn't load audit events." onRetry={() => refetch()} />;
  }

  if (!rbacItems.length) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        No RBAC audit events recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
              Timestamp
            </th>
            <th className="pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
              Action
            </th>
            <th className="pb-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
              Resource
            </th>
            <th className="pb-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
              Actor
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rbacItems.map((log) => (
            <tr key={log.id} className="hover:bg-bg/50">
              <td className="py-2.5 pr-4 text-xs text-text-muted">
                {new Date(log.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-2.5 pr-4">
                <Badge tone="neutral">{log.action}</Badge>
              </td>
              <td className="py-2.5 pr-4 text-text-muted">
                {log.resourceType}
                {log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}
              </td>
              <td className="py-2.5 text-text-muted">
                {log.actorEmployeeId?.slice(0, 8) ?? "System"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function PermissionsScreen() {
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: roles, isLoading: rolesLoading, isError, refetch } = useRoles();
  const createRole = useCreateRole();
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const updateRole = useUpdateRole(editing?.id ?? "");
  const deleteRole = useDeleteRole();

  const canManage = currentUser?.permissions.has("rbac.manage") ?? false;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage roles, access rights, and approval workflows"
        actions={
          canManage ? (
            <Button onClick={() => setEditing(null)}>New role</Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="matrix">Access Matrix</TabsTrigger>
          <TabsTrigger value="approvals">Approval Hierarchy</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Roles tab */}
        <TabsContent value="roles">
          <Card>
            <CardContent>
              {isError ? (
                <ErrorState description="Couldn't load roles." onRetry={() => refetch()} />
              ) : (
                <DataTable
                  columns={getRoleColumns({
                    canManage,
                    onEdit: (role) => setEditing(role),
                    onDelete: (role) => setDeleting(role),
                  })}
                  data={roles ?? []}
                  loading={rolesLoading}
                  emptyTitle="No roles yet"
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access matrix tab */}
        <TabsContent value="matrix">
          <Card>
            <CardContent>
              <AccessMatrixTab canManage={canManage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval hierarchy tab */}
        <TabsContent value="approvals">
          <ApprovalHierarchyTab />
        </TabsContent>

        {/* Integrated audit log tab */}
        <TabsContent value="audit">
          <Card>
            <CardContent>
              <AuditLogTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role dialogs */}
      {editing !== undefined && (
        <RoleFormDialog
          key={editing?.id ?? "create"}
          role={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSubmit={async (input) => {
            if (editing) {
              await updateRole.mutateAsync(input);
              push({ title: "Role updated", tone: "success" });
            } else {
              await createRole.mutateAsync(input);
              push({ title: "Role created", tone: "success" });
            }
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This can't be undone. Roles still assigned to employees can't be deleted."
        intent="destructive"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteRole.mutateAsync(deleting.id);
            push({ title: "Role deleted", tone: "success" });
          } catch (error) {
            push({
              title: "Couldn't delete role",
              description: error instanceof Error ? error.message : undefined,
              tone: "error",
            });
          }
        }}
      />
    </div>
  );
}
