"use client";

import { Bell, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AiDrawerTrigger } from "@/components/layout/ai-drawer-trigger";
import { useTheme } from "@/lib/theme/theme-provider";

export function TopBar({
  breadcrumb,
  user,
  notificationCount = 0,
  onSignOut,
  onOpenChat,
}: {
  breadcrumb?: React.ReactNode;
  user: { name: string; role: string; avatarUrl?: string | null };
  notificationCount?: number;
  onSignOut?: () => void;
  onOpenChat?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-glass-border bg-glass-surface-subtle px-6 backdrop-blur-glass-sm backdrop-saturate-150">
      <div className="text-sm text-text-muted">{breadcrumb}</div>

      <div className="flex items-center gap-2">
        <IconButton label="Toggle theme" intent="ghost" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </IconButton>

        {/* Notification bell */}
        <div className="relative">
          <IconButton
            label="Notifications"
            intent="ghost"
            onClick={() => router.push("/notifications")}
          >
            <Bell className="size-4.5" />
          </IconButton>
          {notificationCount > 0 && (
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-danger-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </div>

        {/* AI assistant drawer trigger */}
        {onOpenChat && <AiDrawerTrigger onClick={onOpenChat} />}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <span className="text-sm font-medium text-text">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.role}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="size-4" /> My profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={onSignOut}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
