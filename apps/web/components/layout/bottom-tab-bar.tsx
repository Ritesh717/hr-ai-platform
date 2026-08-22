"use client";

import { Bell, LayoutDashboard, MoreHorizontal, Sparkles, User, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useCurrentUser } from "@/lib/auth/use-current-user";

interface TabItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

function TabButton({ item }: { item: TabItem }) {
  const pathname = usePathname();
  const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
  const Icon = item.icon;

  const inner = (
    <>
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors",
          active ? "text-primary" : "text-text-muted",
        )}
      />
      <span
        className={cn(
          "text-[10px] font-medium leading-none transition-colors",
          active ? "text-primary" : "text-text-muted",
        )}
      >
        {item.label}
      </span>
    </>
  );

  const baseClass = "flex flex-1 flex-col items-center justify-center gap-1 py-2";

  if (item.onClick) {
    return (
      <button type="button" className={baseClass} onClick={item.onClick}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={item.href!} className={baseClass}>
      {inner}
    </Link>
  );
}

export function BottomTabBar({ onOpenChat }: { onOpenChat?: () => void }) {
  const { data: currentUser } = useCurrentUser();
  const isManager = currentUser?.permissions.has("leave.approve");

  const tabs: TabItem[] = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    ...(isManager ? [{ href: "/my-team", label: "Team", icon: Users2 }] : []),
    { label: "AI", icon: Sparkles, onClick: onOpenChat },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ];

  // Clamp to 5 items; show "More" if there are extra items from manager/admin lenses
  const visibleTabs = tabs.slice(0, 4);
  const hasMore = tabs.length > 4;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-glass-border bg-glass-surface backdrop-blur-glass backdrop-saturate-150 md:hidden">
      {visibleTabs.map((tab) => (
        <TabButton key={tab.href ?? tab.label} item={tab} />
      ))}
      {hasMore && (
        <TabButton
          item={{ href: "/menu", label: "More", icon: MoreHorizontal }}
        />
      )}
    </nav>
  );
}
