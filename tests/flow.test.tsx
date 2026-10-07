import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { allSteps } from "../src/content/lessons";
import * as narration from "../src/lib/narration";
import type { NarrationHandlers } from "../src/lib/narration";

let handlers: NarrationHandlers = {};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(narration, "narrate").mockImplementation((_id, _t, h = {}) => {
    handlers = h;
    return () => {};
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const title = () => screen.getByRole("heading", { level: 2 });

// No recorded video in tests: fail the step video so narration starts.
function startNarration(container: HTMLElement) {
  const v = container.querySelector("video");
  if (v) fireEvent.error(v);
}

describe("guided flow", () => {
  it("highlights the word being narrated in the caption", () => {
    const { container } = render(<App />);
    startNarration(container);
    act(() => handlers.onWord?.(2));
    const active = screen.getByTestId("caption").querySelector(".word-active");
    expect(active).not.toBeNull();
    expect(active!.getAttribute("data-word")).toBe("2");
  });

  it("moves to the next step automatically when narration completes", () => {
    const { container } = render(<App />);
    startNarration(container);
    act(() => handlers.onEnd?.(true));
    expect(title()).toHaveTextContent(allSteps[0].title);
    act(() => vi.advanceTimersByTime(1600));
    expect(title()).toHaveTextContent(allSteps[1].title);
  });

  it("does not advance when narration was stopped, or when auto mode is off", () => {
    const { container } = render(<App />);
    startNarration(container);
    act(() => handlers.onEnd?.(false));
    act(() => vi.advanceTimersByTime(3000));
    expect(title()).toHaveTextContent(allSteps[0].title);

    fireEvent.click(screen.getByRole("button", { name: /מעבר אוטומטי/ }));
    act(() => handlers.onEnd?.(true));
    act(() => vi.advanceTimersByTime(3000));
    expect(title()).toHaveTextContent(allSteps[0].title);
    expect(screen.getByRole("button", { name: /מעבר ידני/ })).toHaveAttribute("aria-pressed", "false");
  });
});
