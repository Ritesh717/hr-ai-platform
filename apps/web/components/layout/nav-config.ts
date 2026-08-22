import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Users2,
} from "lucide-react";
import type { PermissionCode } from "@/lib/api/types";

export interface NavConfigItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Omit for items every authenticated employee can see. */
  permission?: PermissionCode;
}

export interface NavLens {
  id: "everyone" | "manager" | "hr-admin";
  title: string;
  /** Lens section is only shown when the user has at least one of these permissions. */
  requiresAny?: PermissionCode[];
  items: NavConfigItem[];
}

export const navConfig: NavLens[] = [
  {
    id: "everyone",
    title: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/profile", label: "My Profile", icon: User },
      { href: "/time", label: "Time & Attendance", icon: Clock },
      { href: "/leave", label: "Leave", icon: CalendarClock },
      { href: "/payroll", label: "Payroll", icon: CreditCard },
      { href: "/chat", label: "AI Assistant", icon: Sparkles },
    ],
  },
  {
    id: "manager",
    title: "Manager",
    requiresAny: ["leave.approve"],
    items: [
      { href: "/my-team", label: "My Team", icon: Users2 },
      { href: "/departments", label: "Organization", icon: Building2 },
      { href: "/approvals", label: "Approvals", icon: CheckCircle2 },
    ],
  },
  {
    id: "hr-admin",
    title: "HR Admin",
    requiresAny: ["employee.write", "rbac.manage"],
    items: [
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { href: "/audit-log", label: "Audit Log", icon: ScrollText },
    ],
  },
];
