"use client";

import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/features/assistant/use-assistant-conversations";

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationHistorySidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  className,
}: {
  conversations: Conversation[];
  currentId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-[280px] shrink-0 flex-col gap-2 border-r border-glass-border bg-glass-surface-subtle p-3",
        className,
      )}
    >
      <Button
        intent="secondary"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={onNew}
      >
        <MessageSquarePlus className="size-4" />
        New conversation
      </Button>

      <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-text-subtle">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.id)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                conv.id === currentId
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-bg hover:text-text",
              )}
            >
              <span className="line-clamp-1 text-sm font-medium leading-snug">
                {conv.title}
              </span>
              <span className="text-[11px] leading-none text-text-subtle">
                {relativeDate(conv.createdAt)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
