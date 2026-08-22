"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ResponseRenderer } from "@/components/chat/response-renderer";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
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
    <div className="bg-page flex h-dvh w-full">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          breadcrumb={breadcrumb}
          user={user}
          onSignOut={onSignOut}
          onOpenChat={() => setChatOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <Drawer open={chatOpen} onOpenChange={setChatOpen}>
        <DrawerContent className="flex flex-col p-0">
          <DrawerTitle className="sr-only">HR Copilot</DrawerTitle>
          <DrawerDescription className="sr-only">
            Chat with the HR Copilot about your profile, leave, manager, or payslips.
          </DrawerDescription>
          <ChatPanel
            title="HR Copilot"
            subtitle="Ask about your profile, leave, manager, or payslips"
            messages={messages}
            isResponding={isResponding}
            onSendMessage={sendMessage}
            onStopResponse={stopResponse}
            renderMessageContent={(msg) => <ResponseRenderer message={msg} />}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
