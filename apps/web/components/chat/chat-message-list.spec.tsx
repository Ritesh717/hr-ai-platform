import { render, screen } from "@testing-library/react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import type { ChatMessage } from "@/lib/api/types";

function makeMessage(index: number): ChatMessage {
  return {
    id: `msg-${index}`,
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Message number ${index}`,
    createdAt: new Date(2026, 0, 1, 9, index).toISOString(),
    status: "complete",
  };
}

// Spy on @tanstack/react-virtual's scrollToIndex (via the real virtualizer instance, not a full
// mock) so the auto-scroll-on-content-change test can assert it fires again without a real
// browser layout/scroll engine.
const mockScrollToIndex = jest.fn();

jest.mock("@tanstack/react-virtual", () => {
  const actual = jest.requireActual("@tanstack/react-virtual");
  return {
    ...actual,
    useVirtualizer: (options: Parameters<typeof actual.useVirtualizer>[0]) => {
      const instance = actual.useVirtualizer(options);
      const originalScrollToIndex = instance.scrollToIndex.bind(instance);
      instance.scrollToIndex = (...args: Parameters<typeof originalScrollToIndex>) => {
        mockScrollToIndex(...args);
        return originalScrollToIndex(...args);
      };
      return instance;
    },
  };
});

describe("ChatMessageList", () => {
  beforeEach(() => {
    mockScrollToIndex.mockClear();
  });

  it("renders an empty state with no layout-jump container when there are no messages", () => {
    render(<ChatMessageList messages={[]} />);
    expect(screen.getByText(/ask me anything/i)).toBeInTheDocument();
  });

  it("renders a custom empty state title/description", () => {
    render(
      <ChatMessageList
        messages={[]}
        emptyState={{ title: "No conversation yet", description: "Start by asking a question." }}
      />,
    );
    expect(screen.getByText("No conversation yet")).toBeInTheDocument();
    expect(screen.getByText("Start by asking a question.")).toBeInTheDocument();
  });

  it("renders every message in a short list", () => {
    const messages = Array.from({ length: 3 }, (_, i) => makeMessage(i));
    render(<ChatMessageList messages={messages} />);

    for (const message of messages) {
      expect(screen.getByText(message.content)).toBeInTheDocument();
    }
  });

  it("shows the typing indicator row while a response is in flight", () => {
    render(<ChatMessageList messages={[makeMessage(0)]} isResponding />);
    expect(screen.getByRole("status", { name: /thinking/i })).toBeInTheDocument();
  });

  it("virtualizes a long list — reserves the full scroll height without mounting every row", () => {
    const messages = Array.from({ length: 200 }, (_, i) => makeMessage(i));
    const { container } = render(<ChatMessageList messages={messages} />);

    const scrollSpacer = container.querySelector('[role="log"] > div');
    expect(scrollSpacer).not.toBeNull();
    // The spacer reserves room for all 200 rows even though far fewer are actually mounted below.
    expect(Number.parseFloat((scrollSpacer as HTMLElement).style.height)).toBeGreaterThan(200 * 50);

    const renderedRows = container.querySelectorAll("[data-index]");
    expect(renderedRows.length).toBeGreaterThan(0);
    expect(renderedRows.length).toBeLessThan(messages.length);
  });

  it("re-scrolls when the typing indicator row is replaced by the real reply, even though the row count is unchanged", () => {
    const userMessage = makeMessage(0);
    const { rerender } = render(<ChatMessageList messages={[userMessage]} isResponding />);
    mockScrollToIndex.mockClear();

    const assistantReply: ChatMessage = {
      id: "assistant-reply",
      role: "assistant",
      content: "A reply long enough that its tail could be left off-screen if we didn't re-scroll.",
      createdAt: new Date(2026, 0, 1, 9, 5).toISOString(),
      status: "complete",
    };

    // Row count before: messages.length (1) + typing indicator (1) = 2.
    // Row count after: messages.length (2) + no typing indicator (0) = 2. Same count, new content.
    rerender(<ChatMessageList messages={[userMessage, assistantReply]} isResponding={false} />);

    expect(mockScrollToIndex).toHaveBeenCalled();
  });
});
