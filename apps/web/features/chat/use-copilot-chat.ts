"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/api/types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `local-${Date.now()}-${counter}`;
}

const CANNED_REPLIES = [
  "I'll be able to answer that once the Employee Agent is wired up (issue #67) — for now this is a local placeholder reply, not a real answer.",
  "Good question for the Employee Agent. Real answers about your profile, leave, manager, or payslips land once issue #67 connects this panel to the backend.",
];

/**
 * Local-only conversation state for the global HR Copilot drawer/full-page host. Deliberately
 * does NOT call `POST /api/v1/agent/employee/chat` — wiring to the real Employee Agent endpoint
 * is issue #67, a separate story. Messages live in React state only, never localStorage/
 * sessionStorage, matching blueprint §28's rule against persisting HR content client-side; a
 * refresh or unmount loses the conversation by design.
 */
export function useCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const pendingReplyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback((text: string) => {
    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      status: "complete",
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsResponding(true);

    // Stands in for the real request/await/response round trip (non-streaming today — see
    // EmployeeAgentService's generateText call) until issue #67 replaces this with the live fetch.
    pendingReplyTimeout.current = setTimeout(() => {
      const reply = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
          status: "complete",
        },
      ]);
      setIsResponding(false);
      pendingReplyTimeout.current = null;
    }, 900);
  }, []);

  const stopResponse = useCallback(() => {
    // The current (non-streaming) backend call can't actually be cancelled mid-flight — this
    // only cancels the local mock's timer. Kept as a real, working callback (not a no-op stub) so
    // ChatComposer's stop-button plumbing is genuinely exercised ahead of streaming support.
    if (pendingReplyTimeout.current) {
      clearTimeout(pendingReplyTimeout.current);
      pendingReplyTimeout.current = null;
    }
    setIsResponding(false);
  }, []);

  return { messages, isResponding, sendMessage, stopResponse };
}
