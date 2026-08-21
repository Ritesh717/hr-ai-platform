import "@testing-library/jest-dom";

// jsdom doesn't implement ResizeObserver, which @tanstack/react-virtual (ChatMessageList) needs
// to measure row heights. A minimal no-op stub is enough for component tests — real measurement
// only matters in an actual browser, which the light/dark/viewport QA pass covers manually.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  // @ts-expect-error -- test-only stub, not a spec-complete ResizeObserver
  window.ResizeObserver = ResizeObserverStub;
}

// jsdom doesn't implement scrollIntoView either — ChatMessageList calls it to keep the latest
// message in view on new-message arrival.
if (typeof window !== "undefined" && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// jsdom has no layout engine, so every element measures as a 0x0 box by default —
// @tanstack/react-virtual (ChatMessageList) reads offsetWidth/offsetHeight (and
// getBoundingClientRect via the ResizeObserver fallback path) to size its scroll viewport, and
// with a 0-height viewport it computes an empty visible range. Give every element a plausible
// non-zero box so the virtualizer's range calculation behaves the same as it would in a real
// browser; this doesn't affect any layout assertion since jsdom never lays elements out
// individually anyway.
if (typeof HTMLElement !== "undefined") {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 600 });
}
if (typeof Element !== "undefined") {
  Element.prototype.getBoundingClientRect = () => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  });
}
