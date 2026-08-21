"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { IconButton } from "@/components/ui/icon-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCopilotChat } from "@/features/chat/use-copilot-chat";

export function AppShell({
  breadcrumb,
  user,
  onSignOut,
  children,
}: {
  breadcrumb?: React.ReactNode;
  user: { name: string; role: string; avatarUrl?: string | null };
  onSignOut?: () => void;
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const { messages, isResponding, sendMessage, stopResponse } = useCopilotChat();

  return (
    <div className="glass-backdrop flex h-dvh w-full">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar breadcrumb={breadcrumb} user={user} onSignOut={onSignOut} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Global copilot slot — chat shell built in UI stage F2 (story #65); real Employee Agent wiring is issue #67. */}
      <IconButton
        label="Open HR Copilot"
        intent="primary"
        size="lg"
        className="fixed bottom-6 right-6 rounded-full shadow-md"
        onClick={() => setChatOpen(true)}
      >
        <MessageCircle className="size-5" />
      </IconButton>

      <Drawer open={chatOpen} onOpenChange={setChatOpen}>
        <DrawerContent className="flex flex-col p-0">
          {/* Visually hidden — ChatPanel renders its own visible title/subtitle in the header row. */}
          <DrawerTitle className="sr-only">HR Copilot</DrawerTitle>
          <DrawerDescription className="sr-only">
            Chat with the HR Copilot about your profile, leave, manager, or payslips.
          </DrawerDescription>
          {/*
            Local-only mock state (features/chat/use-copilot-chat.ts) — not wired to the real
            Employee Agent endpoint yet. That wiring is issue #67; this proves ChatPanel works as
            the persistent right-side Drawer host per ui-plan.md §4.4.
          */}
          <ChatPanel
            title="HR Copilot"
            subtitle="Ask about your profile, leave, manager, or payslips"
            messages={messages}
            isResponding={isResponding}
            onSendMessage={sendMessage}
            onStopResponse={stopResponse}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
