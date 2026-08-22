"use client";

import { History, X } from "lucide-react";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ConversationHistorySidebar } from "@/components/chat/conversation-history-sidebar";
import { ResponseRenderer } from "@/components/chat/response-renderer";
import { IconButton } from "@/components/ui/icon-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAssistantConversations } from "@/features/assistant/use-assistant-conversations";

export function AiAssistantScreen({ context }: { context?: string }) {
  const { conversations, current, isResponding, newConversation, selectConversation, sendMessage, stopResponse } =
    useAssistantConversations();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contextDismissed, setContextDismissed] = useState(false);

  const showContextBanner = Boolean(context && !contextDismissed);

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[var(--radius-xl)] border border-glass-border bg-glass-surface shadow-glass-md backdrop-blur-glass backdrop-saturate-150">
      {/* Conversation history — desktop sidebar */}
      <ConversationHistorySidebar
        conversations={conversations}
        currentId={current.id}
        onSelect={selectConversation}
        onNew={newConversation}
        className="hidden md:flex"
      />

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Context banner */}
        {showContextBanner && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-glass-border bg-primary-weak px-4 py-2.5">
            <p className="text-sm text-text-muted">
              <span className="font-medium text-text">Context: </span>
              {context}
            </p>
            <IconButton
              label="Dismiss context"
              intent="ghost"
              size="sm"
              onClick={() => setContextDismissed(true)}
            >
              <X className="size-3.5" />
            </IconButton>
          </div>
        )}

        <ChatPanel
          title="AI Assistant"
          subtitle="Ask anything about HR, leave, payroll, or your team"
          messages={current.messages}
          isResponding={isResponding}
          onSendMessage={sendMessage}
          onStopResponse={stopResponse}
          renderMessageContent={(msg) => <ResponseRenderer message={msg} />}
          emptyState={{
            title: "How can I help you?",
            description: "Ask about leave balances, payslips, team info, or anything HR-related.",
          }}
          headerActions={
            /* Show history button on mobile */
            <IconButton
              label="Conversation history"
              intent="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-4.5" />
            </IconButton>
          }
        />
      </div>

      {/* Conversation history — mobile Drawer */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerContent className="flex flex-col p-0" style={{ maxWidth: "320px" }}>
          <DrawerTitle className="sr-only">Conversation history</DrawerTitle>
          <DrawerDescription className="sr-only">
            Your past AI Assistant conversations
          </DrawerDescription>
          <ConversationHistorySidebar
            conversations={conversations}
            currentId={current.id}
            onSelect={(id) => {
              selectConversation(id);
              setHistoryOpen(false);
            }}
            onNew={() => {
              newConversation();
              setHistoryOpen(false);
            }}
            className="flex h-full w-full"
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
