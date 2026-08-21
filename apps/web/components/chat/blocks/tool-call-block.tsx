"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ChatToolCallTrace } from "@/lib/api/types";

export interface ToolCallBlockProps {
  toolCall: ChatToolCallTrace;
  className?: string;
}

// Collapsed "used `get_manager`" trace, expandable to show the call's input arguments.
//
// Note: the current AgentChatResponseDto only carries `input`, not the tool's result — the
// expanded view shows call arguments only until a follow-up backend change adds results to the
// response (issue #66 gap: "flag this gap explicitly in the PR, don't silently fabricate a
// result field").
export function ToolCallBlock({ toolCall, className }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const hasInput =
    toolCall.input !== null &&
    toolCall.input !== undefined &&
    Object.keys(toolCall.input as object).length > 0;

  return (
    <div
      className={cn(
        "my-1 rounded-lg border border-glass-border bg-glass-surface/50 text-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-text-muted hover:text-text"
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block transition-transform",
            expanded ? "rotate-90" : "rotate-0",
          )}
        >
          ▶
        </span>
        <span>
          Used <code className="rounded bg-glass-surface px-1 font-mono text-text">{toolCall.name}</code>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-glass-border px-3 py-2">
          {hasInput ? (
            <>
              <p className="mb-1 font-medium text-text-muted">Arguments</p>
              <pre className="overflow-x-auto rounded bg-glass-surface p-2 font-mono text-text">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </>
          ) : (
            <p className="text-text-muted">No arguments.</p>
          )}
          {/* Tool result is not included in the current response DTO — a follow-up backend
              change (adding `output` to AgentToolCallResponseDto) is needed to show it here. */}
          <p className="mt-2 text-text-muted italic">
            Tool result not yet available in the response — tracked as a follow-up.
          </p>
        </div>
      ) : null}
    </div>
  );
}
