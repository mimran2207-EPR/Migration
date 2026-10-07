import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import * as narration from "../src/lib/narration";
import type { NarrationHandlers } from "../src/lib/narration";

let handlers: NarrationHandlers = {};
const pause = vi.fn();
const resume = vi.fn();

beforeEach(() => {
  localStorage.clear();
  pause.mockClear();
  resume.mockClear();
  vi.spyOn(narration, "narrate").mockImplementation((_id, _t, h = {}) => {
    handlers = h;
    return Object.assign(() => {}, { pause, resume });
  });
});
afterEach(() => vi.restoreAllMocks());

describe("player bar", () => {
  it("pauses and resumes the narration", () => {
    const { container } = render(<App />);
    fireEvent.error(container.querySelector("video")!);
    fireEvent.click(screen.getByRole("button", { name: "השהה" }));
    expect(pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "המשך" }));
    expect(resume).toHaveBeenCalled();
  });

  it("shows playback progress", () => {
    const { container } = render(<App />);
    fireEvent.error(container.querySelector("video")!);
    act(() => handlers.onProgress?.(0.5));
    expect(screen.getByRole("progressbar", { name: "התקדמות ההסבר" })).toHaveAttribute("aria-valuenow", "50");
  });
});
