"use client";

import { X, Bell, FileText, AtSign, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/api/notifications";

const TYPE_CONFIG = {
  leave:   { Icon: FileText, color: "text-info" },
  expense: { Icon: FileText, color: "text-warning" },
  mention: { Icon: AtSign,   color: "text-primary" },
  system:  { Icon: Bell,     color: "text-text-muted" },
  policy:  { Icon: BookOpen, color: "text-success" },
} as const;

function relativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return `${diffD} days ago`;
}

interface Props {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction: (id: string, label: string) => void;
}

export function ActionableNotification({ notification, onDismiss, onAction }: Props) {
  const { Icon, color } = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;

  return (
    <div
      className={cn(
        "relative flex gap-3 rounded-xl border p-4 transition-all",
        notification.read
          ? "border-border bg-surface"
          : "border-primary/20 bg-primary/5 shadow-sm",
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}

      {/* Icon */}
      <div className={cn("mt-0.5 shrink-0", color)}>
        <Icon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", notification.read ? "text-text-muted" : "text-text")}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{notification.body}</p>

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && !notification.read && (
          <div className="mt-3 flex flex-wrap gap-2">
            {notification.actions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                intent={
                  action.variant === "destructive"
                    ? "destructive"
                    : action.variant === "primary"
                      ? "primary"
                      : "secondary"
                }
                onClick={() => onAction(notification.id, action.label)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        <p className="mt-1.5 text-[11px] text-text-muted">{relativeTime(notification.timestamp)}</p>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-text-muted hover:bg-bg hover:text-text"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
