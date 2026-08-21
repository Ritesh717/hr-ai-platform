import { act, renderHook } from "@testing-library/react";
import { useCopilotChat } from "@/features/chat/use-copilot-chat";

describe("useCopilotChat", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends a message and eventually appends a canned assistant reply", () => {
    const { result } = renderHook(() => useCopilotChat());

    act(() => {
      result.current.sendMessage("What's my leave balance?");
    });
    expect(result.current.isResponding).toBe(true);
    expect(result.current.messages).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(result.current.isResponding).toBe(false);
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe("assistant");
  });

  it("clears the pending mock-reply timer on unmount instead of leaking it", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const { result, unmount } = renderHook(() => useCopilotChat());

    act(() => {
      result.current.sendMessage("Am I about to unmount mid-response?");
    });
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();

    // The unmount cleanup must clear the pending timer itself...
    expect(clearTimeoutSpy).toHaveBeenCalled();
    // ...so no timers are left pending to fire (and call setState) after unmount.
    expect(jest.getTimerCount()).toBe(0);

    clearTimeoutSpy.mockRestore();
  });
});
