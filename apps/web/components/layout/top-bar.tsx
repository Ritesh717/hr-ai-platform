"use client";

import { Bell, LogOut, Moon, Settings, Sun, User } from "lucide-react";
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
import { useTheme } from "@/lib/theme/theme-provider";

export function TopBar({
  breadcrumb,
  user,
  onSignOut,
}: {
  breadcrumb?: React.ReactNode;
  user: { name: string; role: string; avatarUrl?: string | null };
  onSignOut?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="text-sm text-text-muted">{breadcrumb}</div>

      <div className="flex items-center gap-2">
        <IconButton label="Toggle theme" intent="ghost" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </IconButton>
        <IconButton label="Notifications" intent="ghost">
          <Bell className="size-4.5" />
        </IconButton>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <span className="text-sm font-medium text-text">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.role}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" /> My profile
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
