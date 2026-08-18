import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users } from "lucide-react";

export interface NavConfigItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavConfigSection {
  title: string;
  items: NavConfigItem[];
}

/**
 * Extended per UI stage (ui-plan.md §6) as each stage's screens land —
 * add entries here rather than hardcoding links in the Sidebar itself.
 */
export const navConfig: NavConfigSection[] = [
  {
    title: "Main menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/employees", label: "Employees", icon: Users },
    ],
  },
];
