import type { LucideIcon } from "lucide-react";
import { Building2, LayoutDashboard, ScrollText, ShieldCheck, Users } from "lucide-react";
import type { PermissionCode } from "@/lib/api/types";

export interface NavConfigItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Omit for items every authenticated employee can see (e.g. Dashboard). */
  permission?: PermissionCode;
}

export interface NavConfigSection {
  title: string;
  items: NavConfigItem[];
}

/**
 * Extended per UI stage (ui-plan.md §6) as each stage's screens land —
 * add entries here rather than hardcoding links in the Sidebar itself. Sidebar filters items
 * against the current user's live permission set (see lib/auth/use-current-user.ts), not role
 * name — roles are fully dynamic per tenant, so gating must be permission-based.
 */
export const navConfig: NavConfigSection[] = [
  {
    title: "Main menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/employees", label: "Employees", icon: Users, permission: "employee.read" },
      { href: "/departments", label: "Departments", icon: Building2, permission: "department.read" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/roles", label: "Roles & Permissions", icon: ShieldCheck, permission: "rbac.manage" },
      { href: "/audit-log", label: "Audit Log", icon: ScrollText, permission: "audit_log.read" },
    ],
  },
];
