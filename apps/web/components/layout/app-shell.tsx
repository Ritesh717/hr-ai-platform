"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ResponseRenderer } from "@/components/chat/response-renderer";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCopilotChat } from "@/features/chat/use-copilot-chat";
import { fetchNotifications } from "@/lib/api/notifications";

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
  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 60_000,
  });
  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="bg-page flex h-dvh w-full overflow-hidden">
      {/* Sidebar: hidden below 768px, icon-rail at 768–1279px, full at 1280px+ */}
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          breadcrumb={breadcrumb}
          user={user}
          onSignOut={onSignOut}
          onOpenChat={() => setChatOpen(true)}
          notificationCount={unreadCount}
        />
        {/* Extra bottom padding on mobile so content clears the tab bar */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar — hidden at 768px+ */}
      <BottomTabBar onOpenChat={() => setChatOpen(true)} />

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
