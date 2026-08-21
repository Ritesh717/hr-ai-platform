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

  // Keying the re-scroll purely off `rowCount` misses the moment the typing-indicator row is
  // replaced by the real assistant reply: messages.length +1 (real reply, isResponding now false)
  // is the same total as messages.length +1 (typing indicator, isResponding still true), so
  // rowCount alone doesn't change even though the last row's content just did. Track the last
  // message's identity/content too so a taller-than-estimated reply still pulls the view down.
  const lastMessage = messages[messages.length - 1];
  const lastMessageSignal = lastMessage ? `${lastMessage.id}:${lastMessage.content}` : "";

  useEffect(() => {
    if (rowCount === 0) return;
    virtualizer.scrollToIndex(rowCount - 1, { align: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-scroll when the row count changes OR the last row's content changes
  }, [rowCount, lastMessageSignal]);

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
