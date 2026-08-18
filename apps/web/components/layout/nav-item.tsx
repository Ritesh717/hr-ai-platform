"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function NavItem({
  href,
  icon: Icon,
  label,
  collapsed,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary/10 text-primary"
          : "text-text-muted hover:bg-bg hover:text-text",
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge ? (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
