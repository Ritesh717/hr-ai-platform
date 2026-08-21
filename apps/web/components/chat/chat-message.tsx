import { forwardRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage as ChatMessageType } from "@/lib/api/types";

const ROLE_LABEL: Record<ChatMessageType["role"], string> = {
  user: "You",
  assistant: "HR Copilot",
  system: "System",
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Placeholder content rendering. Issue #66's ResponseRenderer is the real content pipeline (typed
// blocks: text/markdown, citations, tool-call traces, tables, approval cards, refusals, ...) — this
// just renders plain text plus a minimal tool-call/error caption so the message shell is usable
// before that lands. `renderContent` on ChatMessage/ChatMessageList/ChatPanel is the seam #66 will
// plug into; nothing here should need to change shape when it does.
function DefaultMessageContent({ message }: { message: ChatMessageType }) {
  return (
    <div className="whitespace-pre-wrap break-words text-sm">
      {message.content}
      {message.toolCalls && message.toolCalls.length > 0 ? (
        <p className="mt-2 text-xs text-text-muted">
          Used {message.toolCalls.length} tool{message.toolCalls.length === 1 ? "" : "s"}:{" "}
          {message.toolCalls.map((call) => call.name).join(", ")}
        </p>
      ) : null}
      {message.status === "error" ? (
        <p className="mt-2 text-xs font-medium text-danger">Something went wrong sending this message.</p>
      ) : null}
    </div>
  );
}

export interface ChatMessageProps {
  message: ChatMessageType;
  /** Overrides DefaultMessageContent — the seam issue #66's ResponseRenderer plugs into. */
  renderContent?: (message: ChatMessageType) => React.ReactNode;
  className?: string;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, renderContent, className }, ref) => {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const label = message.authorName ?? ROLE_LABEL[message.role];

    return (
      <div
        ref={ref}
        data-role={message.role}
        className={cn("flex items-start gap-3", isUser && "flex-row-reverse", className)}
      >
        <Avatar name={label} src={message.avatarUrl} size="sm" className="mt-5 shrink-0" />

        <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-1", isUser && "items-end")}>
          <div className={cn("flex items-center gap-2 text-xs text-text-muted", isUser && "flex-row-reverse")}>
            <span className="font-medium text-text">{label}</span>
            <time dateTime={message.createdAt}>{formatTimestamp(message.createdAt)}</time>
          </div>

          <div
            className={cn(
              "rounded-2xl border px-4 py-2.5 text-text",
              isUser
                ? "rounded-br-sm border-primary/30 bg-primary/10"
                : "rounded-bl-sm border-glass-border bg-glass-surface backdrop-blur-glass-md backdrop-saturate-150",
              isSystem && "border-dashed",
            )}
          >
            {(renderContent ?? ((m: ChatMessageType) => <DefaultMessageContent message={m} />))(message)}
          </div>
        </div>
      </div>
    );
  },
);
ChatMessage.displayName = "ChatMessage";
