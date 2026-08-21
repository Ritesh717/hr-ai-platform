import { render, screen } from "@testing-library/react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { ChatMessage } from "@/lib/api/types";

const messages: ChatMessage[] = [
  { id: "1", role: "user", content: "What's my leave balance?", createdAt: new Date().toISOString() },
  { id: "2", role: "assistant", content: "You have 12 days remaining.", createdAt: new Date().toISOString() },
];

// Same host-agnostic assertions run against both hosts below — proves ChatPanel renders
// identically regardless of container (ui-plan.md §4.4's Drawer-vs-full-page requirement).
function expectPanelContent() {
  expect(screen.getAllByText("HR Copilot").length).toBeGreaterThan(0);
  expect(screen.getByText("What's my leave balance?")).toBeInTheDocument();
  expect(screen.getByText("You have 12 days remaining.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
}

describe("ChatPanel", () => {
  it("renders as a full-page host", () => {
    render(
      <div className="flex h-[800px] w-full">
        <ChatPanel title="HR Copilot" messages={messages} onSendMessage={jest.fn()} />
      </div>,
    );
    expectPanelContent();
  });

  it("renders identically inside a Drawer host", () => {
    render(
      <Drawer open>
        <DrawerContent className="flex flex-col p-0">
          <DrawerTitle className="sr-only">HR Copilot</DrawerTitle>
          <DrawerDescription className="sr-only">Chat with the HR Copilot.</DrawerDescription>
          <ChatPanel title="HR Copilot" messages={messages} onSendMessage={jest.fn()} />
        </DrawerContent>
      </Drawer>,
    );
    expectPanelContent();
  });
});
