"use client";

import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/icon-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navConfig } from "@/components/layout/nav-config";
import { NavItem } from "@/components/layout/nav-item";
import { NavSection } from "@/components/layout/nav-section";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function Sidebar() {
  // Desktop (≥1280px) starts expanded; tablet (768–1279px) starts as icon-rail.
  const [collapsed, setCollapsed] = useState(false);
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (window.innerWidth < 1280) setCollapsed(true);
  }, []);

  const visibleLenses = navConfig
    .map((lens) => ({
      ...lens,
      items: lens.items.filter(
        (item) => !item.permission || currentUser?.permissions.has(item.permission),
      ),
    }))
    .filter((lens) => {
      if (lens.items.length === 0) return false;
      if (!lens.requiresAny) return true;
      return lens.requiresAny.some((p) => currentUser?.permissions.has(p));
    });

  return (
    <TooltipProvider delayDuration={100}>
      {/* hidden below 768px; at 768–1279px auto-collapses to icon-rail via useEffect */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col gap-6 border-r border-glass-border bg-glass-surface-subtle p-4 backdrop-blur-glass-sm backdrop-saturate-150 transition-all duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-2 px-1", collapsed && "justify-center")}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4.5" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-text">HR Copilot</span>
          )}
        </div>

        {/* Nav lenses */}
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
          {visibleLenses.map((lens) => (
            <NavSection key={lens.id} title={lens.title} collapsed={collapsed}>
              {lens.items.map((item) => (
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

        {/* Collapse toggle — lets user expand/collapse at any desktop/tablet width */}
        <IconButton
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          intent="secondary"
          size="sm"
          className={cn("self-end", collapsed && "self-center")}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </IconButton>
      </aside>
    </TooltipProvider>
  );
}
