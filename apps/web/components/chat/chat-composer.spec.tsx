import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatComposer } from "@/components/chat/chat-composer";

describe("ChatComposer", () => {
  it("disables send until there is text, then sends and clears the draft", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    render(<ChatComposer onSend={onSend} />);

    const sendButton = screen.getByRole("button", { name: /send message/i });
    const input = screen.getByRole("textbox", { name: /message/i });

    expect(sendButton).toBeDisabled();

    await user.type(input, "What's my leave balance?");
    expect(sendButton).toBeEnabled();

    await user.click(sendButton);
    expect(onSend).toHaveBeenCalledWith("What's my leave balance?");
    expect(input).toHaveValue("");
  });

  it("does not send whitespace-only input", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    render(<ChatComposer onSend={onSend} />);

    const input = screen.getByRole("textbox", { name: /message/i });
    await user.type(input, "   ");

    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("sends on Enter and inserts a newline on Shift+Enter instead", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    render(<ChatComposer onSend={onSend} />);

    const input = screen.getByRole("textbox", { name: /message/i });
    await user.type(input, "hello{Shift>}{Enter}{/Shift}world");
    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveValue("hello\nworld");

    await user.type(input, "{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello\nworld");
  });

  it("disables send while a response is in flight and re-enables on completion", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    const { rerender } = render(<ChatComposer onSend={onSend} />);

    const input = screen.getByRole("textbox", { name: /message/i });
    await user.type(input, "still here?");

    rerender(<ChatComposer onSend={onSend} isResponding />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();

    rerender(<ChatComposer onSend={onSend} isResponding={false} />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  });

  it("keeps the stop button real but inert until a real onStop is wired up", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    const onStop = jest.fn();
    const { rerender } = render(<ChatComposer onSend={onSend} isResponding />);

    // No onStop supplied yet -> disabled, not hidden (the plumbing exists ahead of streaming).
    expect(screen.getByRole("button", { name: /stop response/i })).toBeDisabled();

    rerender(<ChatComposer onSend={onSend} onStop={onStop} isResponding />);
    const stopButton = screen.getByRole("button", { name: /stop response/i });
    expect(stopButton).toBeEnabled();
    await user.click(stopButton);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("disables the whole composer, including the input, when disabled", () => {
    const onSend = jest.fn();
    render(<ChatComposer onSend={onSend} disabled />);

    expect(screen.getByRole("textbox", { name: /message/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("keeps the attachment button stubbed disabled", () => {
    render(<ChatComposer onSend={jest.fn()} />);
    expect(screen.getByRole("button", { name: /attach a file/i })).toBeDisabled();
  });
});
