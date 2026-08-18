"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { IconButton } from "@/components/ui/icon-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

export function AppShell({
  breadcrumb,
  user,
  children,
}: {
  breadcrumb?: React.ReactNode;
  user: { name: string; role: string; avatarUrl?: string | null };
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full bg-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar breadcrumb={breadcrumb} user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Global copilot slot — wired to the Employee Agent in UI stage F2. */}
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
        <DrawerContent>
          <DrawerTitle>HR Copilot</DrawerTitle>
          <DrawerDescription>
            The chat panel lands in UI stage F2, wired to the Employee Agent (backend Stage 2).
          </DrawerDescription>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
