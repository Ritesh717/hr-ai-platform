"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/api/notifications";
import type { Notification, NotificationCategory } from "@/lib/api/notifications";
import { ActionableNotification } from "@/components/patterns/actionable-notification";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type Tab = "action" | "update" | "mention" | "all";

function sectionLabel(iso: string): "Today" | "This week" | "Older" {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 24) return "Today";
  if (diffH < 7 * 24) return "This week";
  return "Older";
}

export function NotificationsScreen() {
  const toast = useToast();
  const { data: initial = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 60_000,
  });

  const [localState, setLocalState] = useState<Record<string, "read" | "dismissed">>({});
  const [tab, setTab] = useState<Tab>("all");

  const notifications: Notification[] = useMemo(
    () =>
      initial
        .filter((n) => localState[n.id] !== "dismissed")
        .map((n) => (localState[n.id] === "read" ? { ...n, read: true } : n)),
    [initial, localState],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (tab === "all") return notifications;
    return notifications.filter((n) => n.category === tab);
  }, [notifications, tab]);

  // Group by date section, preserving order
  const sections = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    for (const n of filtered) {
      const label = sectionLabel(n.timestamp);
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    }
    return Object.entries(groups);
  }, [filtered]);

  const tabCounts: Record<Tab, number> = useMemo(() => ({
    all:     notifications.filter((n) => !n.read).length,
    action:  notifications.filter((n) => !n.read && n.category === "action").length,
    update:  notifications.filter((n) => !n.read && n.category === "update").length,
    mention: notifications.filter((n) => !n.read && n.category === "mention").length,
  }), [notifications]);

  function dismiss(id: string) {
    setLocalState((prev) => ({ ...prev, [id]: "dismissed" }));
  }

  function handleAction(id: string, label: string) {
    setLocalState((prev) => ({ ...prev, [id]: "read" }));
    toast({ title: `Action: ${label}`, description: "Mocked — would call backend in production.", tone: "success" });
  }

  function markAllRead() {
    const updates: Record<string, "read"> = {};
    notifications.filter((n) => !n.read).forEach((n) => { updates[n.id] = "read"; });
    setLocalState((prev) => ({ ...prev, ...updates }));
  }

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: "action",  label: "Action Required" },
    { key: "update",  label: "Updates" },
    { key: "mention", label: "Mentions" },
    { key: "all",     label: "All" },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notifications"
          description={`${unreadCount} unread`}
        />
        {unreadCount > 0 && (
          <Button intent="ghost" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div role="tablist" aria-label="Notification categories" className="flex gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls="notification-panel"
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                : "flex-1 rounded-md px-3 py-1.5 text-xs text-text-muted hover:text-text transition-colors"
            }
          >
            {label}
            {tabCounts[key] > 0 && (
              <span aria-label={`${tabCounts[key]} unread`} className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === key ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-14 text-center">
          <p className="text-sm text-text-muted">No notifications in this category.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map(([sectionName, items]) => (
            <div key={sectionName} className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{sectionName}</p>
              <div className="flex flex-col gap-2">
                {items.map((n) => (
                  <ActionableNotification
                    key={n.id}
                    notification={n}
                    onDismiss={dismiss}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
