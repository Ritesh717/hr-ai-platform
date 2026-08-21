import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/lib/api/types";

export interface ChatPanelProps {
  title?: string;
  subtitle?: string;
  messages: ChatMessage[];
  isResponding?: boolean;
  onSendMessage: (message: string) => void;
  onStopResponse?: () => void;
  disabled?: boolean;
  placeholder?: string;
  emptyState?: { title: string; description?: string };
  renderMessageContent?: (message: ChatMessage) => React.ReactNode;
  /** Slot for a host-specific action (e.g. a Drawer close button) — ChatPanel itself never assumes a host. */
  headerActions?: React.ReactNode;
  className?: string;
}

// The chat container every agent-facing screen reuses (ui-plan.md §4.4) — a persistent right-side
// Drawer (the global copilot) and a full-page view both render this exact component, just inside
// a different host. It never assumes which: sizing is purely container-driven (h-full/w-full off
// the parent), so a Drawer's fixed max-w-md column and a full-page flex-1 panel both work
// unmodified. No backend wiring here — `onSendMessage`/`onStopResponse` are supplied by the
// caller (issue #67 wires them to POST /api/v1/agent/employee/chat; today's AppShell usage wires
// them to a local-only mock, see features/chat/use-copilot-chat.ts).
export function ChatPanel({
  title = "HR Copilot",
  subtitle,
  messages,
  isResponding = false,
  onSendMessage,
  onStopResponse,
  disabled = false,
  placeholder,
  emptyState,
  renderMessageContent,
  headerActions,
  className,
}: ChatPanelProps) {
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-glass-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{title}</p>
          {subtitle ? <p className="truncate text-xs text-text-muted">{subtitle}</p> : null}
        </div>
        {headerActions}
      </div>

      <ChatMessageList
        messages={messages}
        isResponding={isResponding}
        renderMessageContent={renderMessageContent}
        emptyState={emptyState}
      />

      <div className="shrink-0 border-t border-glass-border p-3">
        <ChatComposer
          onSend={onSendMessage}
          onStop={onStopResponse}
          isResponding={isResponding}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
