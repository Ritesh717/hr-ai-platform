"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { postAgentChat, toToolCallTrace } from "@/lib/api/agent";
import type { ChatMessage } from "@/lib/api/types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `local-${Date.now()}-${counter}`;
}

// Conversation state for the global HR Copilot drawer/full-page host. Calls the live
// POST /api/v1/agent/employee/chat endpoint (issue #67). Messages live in React state only —
// never localStorage/sessionStorage — matching blueprint §28's rule against persisting HR
// content client-side; a refresh or unmount loses the conversation by design.
export function useCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  // AbortController for future streaming support — the current non-streaming fetch can't be
  // cancelled mid-flight, but the infrastructure is real so wiring streaming later doesn't
  // require a redesign.
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      status: "complete",
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsResponding(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await postAgentChat(text);

      if (abortRef.current === controller) {
        const assistantMessage: ChatMessage = {
          id: nextId(),
          role: "assistant",
          content: response.reply,
          createdAt: new Date().toISOString(),
          status: "complete",
          toolCalls: response.toolCalls.map(toToolCallTrace),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      if (abortRef.current !== controller) return; // stopped by the user

      const errorContent = err instanceof ApiError
        ? err.message
        : "Something went wrong. Please try again.";

      const errorMessage: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: errorContent,
        createdAt: new Date().toISOString(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      if (abortRef.current === controller) {
        setIsResponding(false);
        abortRef.current = null;
      }
    }
  }, []);

  // Cancels the in-flight fetch and clears the responding state. The current non-streaming
  // fetch will still complete in the background (fetch abort is best-effort), but its result
  // is discarded because abortRef.current no longer matches.
  const stopResponse = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsResponding(false);
  }, []);

  // On unmount (navigation, logout) abort any in-flight request so stale state updates don't
  // fire after unmount.
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  return { messages, isResponding, sendMessage, stopResponse };
}
