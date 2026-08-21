import { cn } from "@/lib/utils/cn";

export interface RefusalBlockProps {
  message?: string;
  className?: string;
}

// Styled refusal/error state — rendered at the chat-transport-error level for HTTP 4xx/5xx
// responses from the agent endpoint (e.g. 403 authorization_error from the domain service,
// 500 internal error).
//
// Note: a "real" structured refusal content-block from the agent itself (where the LLM emits a
// refusal rather than an HTTP error) depends on the backend emitting a typed block in the
// AgentChatResponseDto — that's a future backend story. For now, this block handles the HTTP
// error case at the transport layer.
export function RefusalBlock({ message, className }: RefusalBlockProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm",
        className,
      )}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-danger">
        ⚠
      </span>
      <p className="text-danger">
        {message ?? "I'm not able to complete that request. You may not have permission to access this information, or something went wrong."}
      </p>
    </div>
  );
}
