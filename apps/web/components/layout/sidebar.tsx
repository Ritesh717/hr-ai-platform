"use client";

import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/icon-button";
import { navConfig } from "@/components/layout/nav-config";
import { NavItem } from "@/components/layout/nav-item";
import { NavSection } from "@/components/layout/nav-section";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { data: currentUser } = useCurrentUser();

  const visibleSections = navConfig
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || currentUser?.permissions.has(item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col gap-6 border-r border-glass-border bg-glass-surface-subtle p-4 backdrop-blur-glass-sm backdrop-saturate-150 transition-all duration-200 md:flex",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-2 px-1", collapsed && "justify-center")}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4.5" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-text">HR Copilot</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {visibleSections.map((section) => (
          <NavSection key={section.title} title={section.title} collapsed={collapsed}>
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
              />
            ))}
          </NavSection>
        ))}
      </nav>

      <IconButton
        label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        intent="secondary"
        size="sm"
        className={cn("self-end", collapsed && "self-center")}
        onClick={() => setCollapsed((value) => !value)}
      >
        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
      </IconButton>
    </aside>
  );
}
