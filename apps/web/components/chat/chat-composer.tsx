"use client";

import { Paperclip, Send, Square } from "lucide-react";
import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

export interface ChatComposerProps {
  onSend: (message: string) => void;
  /**
   * Cancels the in-flight response. Today's backend is `generateText`, not `streamText` (see
   * apps/api/src/modules/agent/employee-agent.service.ts), so there's nothing to actually cancel
   * mid-flight yet — leave this undefined and the Stop button stays a real, wired, disabled
   * affordance rather than a hidden one, so streaming support later is a prop, not a redesign.
   */
  onStop?: () => void;
  isResponding?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatComposer({
  onSend,
  onStop,
  isResponding = false,
  disabled = false,
  placeholder = "Ask about your profile, leave, manager, or payslips…",
  className,
}: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !isResponding && !disabled;
  const canStop = isResponding && Boolean(onStop);

  function handleSend() {
    if (!canSend) return;
    onSend(trimmed);
    setDraft("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Guard against IME composition (CJK/Japanese/Korean input, etc.): confirming a composed
    // string also fires a keydown for Enter, which would otherwise submit the draft mid-
    // conversion. `isComposing` tracks React's composition events, and `nativeEvent.isComposing`
    // covers the browsers that report the confirming keydown as still-composing before the
    // compositionend event lands.
    if (event.key === "Enter" && !event.shiftKey && !isComposing && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <form
      className={cn("flex items-end gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <IconButton
        type="button"
        label="Attach a file (coming soon)"
        intent="ghost"
        size="md"
        disabled
      >
        <Paperclip className="size-4" />
      </IconButton>

      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Message"
        className="max-h-40 min-h-10 flex-1 resize-none overflow-y-auto py-2.5"
      />

      <IconButton
        type="button"
        label="Stop response"
        intent="secondary"
        size="md"
        onClick={onStop}
        disabled={!canStop}
      >
        <Square className="size-4 fill-current" />
      </IconButton>

      <IconButton type="submit" label="Send message" intent="primary" size="md" disabled={!canSend}>
        <Send className="size-4" />
      </IconButton>
    </form>
  );
}
