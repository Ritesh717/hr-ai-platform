"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { postAgentChat, toToolCallTrace } from "@/lib/api/agent";
import type { ChatMessage } from "@/lib/api/types";

let msgCounter = 0;
let convCounter = 0;

function nextMsgId() {
  msgCounter += 1;
  return `msg-${Date.now()}-${msgCounter}`;
}
function nextConvId() {
  convCounter += 1;
  return `conv-${Date.now()}-${convCounter}`;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

function makeConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: nextConvId(),
    title: "New conversation",
    createdAt: new Date().toISOString(),
    messages: [],
    ...overrides,
  };
}

// Seed a couple of example past conversations so the history sidebar has content to display.
const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "seed-1",
    title: "How do I request annual leave?",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    messages: [
      {
        id: "seed-1-1",
        role: "user",
        content: "How do I request annual leave?",
        createdAt: new Date(Date.now() - 86_400_000).toISOString(),
        status: "complete",
      },
      {
        id: "seed-1-2",
        role: "assistant",
        content:
          "You can request annual leave through the Time Off section. Navigate to Time Off → New Request, select your dates, and submit. Your manager will be notified for approval.",
        createdAt: new Date(Date.now() - 86_400_000 + 5000).toISOString(),
        status: "complete",
      },
    ],
  },
  {
    id: "seed-2",
    title: "When is the next payroll run?",
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    messages: [
      {
        id: "seed-2-1",
        role: "user",
        content: "When is the next payroll run?",
        createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        status: "complete",
      },
      {
        id: "seed-2-2",
        role: "assistant",
        content:
          "Your next payroll run is scheduled for the last working day of this month. You'll receive your payslip by email and it will also appear in the Payslips section.",
        createdAt: new Date(Date.now() - 3 * 86_400_000 + 3000).toISOString(),
        status: "complete",
      },
    ],
  },
];

export function useAssistantConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    makeConversation(),
    ...SEED_CONVERSATIONS,
  ]);
  const [currentId, setCurrentId] = useState<string>(conversations[0].id);
  const [isResponding, setIsResponding] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const current = conversations.find((c) => c.id === currentId) ?? conversations[0];

  const newConversation = useCallback(() => {
    const conv = makeConversation();
    setConversations((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsResponding(false);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsResponding(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: nextMsgId(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
        status: "complete",
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? {
                ...c,
                // Auto-title from first user message
                title: c.messages.length === 0 ? text.slice(0, 60) : c.title,
                messages: [...c.messages, userMessage],
              }
            : c,
        ),
      );
      setIsResponding(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await postAgentChat(text);
        if (abortRef.current !== controller) return;
        const assistantMessage: ChatMessage = {
          id: nextMsgId(),
          role: "assistant",
          content: response.reply,
          createdAt: new Date().toISOString(),
          status: "complete",
          toolCalls: response.toolCalls.map(toToolCallTrace),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c,
          ),
        );
      } catch (err) {
        if (abortRef.current !== controller) return;
        const errorMessage: ChatMessage = {
          id: nextMsgId(),
          role: "assistant",
          content:
            err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
          status: "error",
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c,
          ),
        );
      } finally {
        if (abortRef.current === controller) {
          setIsResponding(false);
          abortRef.current = null;
        }
      }
    },
    [currentId],
  );

  const stopResponse = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsResponding(false);
  }, []);

  return {
    conversations,
    current,
    isResponding,
    newConversation,
    selectConversation,
    sendMessage,
    stopResponse,
  };
}
