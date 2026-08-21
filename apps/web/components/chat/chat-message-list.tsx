"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageSquareText } from "lucide-react";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage as ChatMessageType } from "@/lib/api/types";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator";

export interface ChatMessageListProps {
  messages: ChatMessageType[];
  isResponding?: boolean;
  renderMessageContent?: (message: ChatMessageType) => React.ReactNode;
  emptyState?: { title: string; description?: string };
  className?: string;
}

// Virtualized message scroll (ui-plan.md §4.4). Row heights vary a lot per message, so this uses
// @tanstack/react-virtual's dynamic measurement (measureElement) rather than a fixed row height —
// that's what keeps a long history from causing layout jump as real heights replace the estimate.
export function ChatMessageList({
  messages,
  isResponding = false,
  renderMessageContent,
  emptyState,
  className,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowCount = messages.length + (isResponding ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 88,
    overscan: 6,
  });

  useEffect(() => {
    if (rowCount === 0) return;
    virtualizer.scrollToIndex(rowCount - 1, { align: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-scroll only when the row count changes
  }, [rowCount]);

  if (rowCount === 0) {
    return (
      <div className={cn("flex flex-1 items-center justify-center overflow-y-auto p-6", className)}>
        <EmptyState
          icon={MessageSquareText}
          title={emptyState?.title ?? "Ask me anything"}
          description={
            emptyState?.description ??
            "Your profile, leave balance, manager, department, and payslips — just ask."
          }
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={cn("flex-1 overflow-y-auto px-4 py-4", className)}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const isTypingRow = virtualRow.index === messages.length;

          return (
            <div
              key={isTypingRow ? "typing-indicator" : messages[virtualRow.index].id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="pb-4"
            >
              {isTypingRow ? (
                <TypingIndicatorRow />
              ) : (
                <ChatMessage message={messages[virtualRow.index]} renderContent={renderMessageContent} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypingIndicatorRow() {
  return (
    <div className="flex items-start gap-3">
      <Avatar name="HR Copilot" size="sm" className="mt-1 shrink-0" />
      <div className="rounded-2xl rounded-bl-sm border border-glass-border bg-glass-surface px-4 py-3 backdrop-blur-glass-md backdrop-saturate-150">
        <ChatTypingIndicator />
      </div>
    </div>
  );
}
