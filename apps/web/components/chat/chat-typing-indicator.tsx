import { cn } from "@/lib/utils/cn";

// "Thinking" state shown while waiting on the agent's (currently non-streaming) reply. Kept as
// its own component — not inlined into ChatMessageList — so the same affordance can be reused
// once streaming lands (e.g. a leading indicator before the first token arrives).
export function ChatTypingIndicator({
  label = "HR Copilot is thinking",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${label}…`}
      className={cn("flex items-center gap-1.5", className)}
    >
      <span aria-hidden className="flex items-center gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-text-muted" />
      </span>
    </div>
  );
}
