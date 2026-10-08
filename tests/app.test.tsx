import { render, screen, fireEvent, within } from "@testing-library/react";
import App from "../src/App";
import { allSteps, findStep } from "../src/content/lessons";
import { loadProgress, markDone, resetProgress, setLast } from "../src/lib/progress";
import { screenUrl, avatarVideoUrl } from "../src/lib/media";

const heading = () => screen.getByRole("heading", { level: 2 });

beforeEach(() => {
  resetProgress();
});

describe("media", () => {
  it("builds screen and avatar urls", () => {
    expect(screenUrl("4.5")).toBe("/screens/4.5.jpg");
    expect(avatarVideoUrl("4.5")).toBe("/avatar/4.5.mp4");
  });
});

describe("App", () => {
  it("shows the welcome module and step 0.1 script", () => {
    render(<App />);
    expect(screen.getAllByText("ברוכים הבאים").length).toBeGreaterThan(0);
    const s01 = findStep("0.1")!.step;
    expect(heading()).toHaveTextContent(s01.title);
    expect(screen.getByTestId("caption")).toHaveTextContent(s01.script);
  });

  it("disables 'הקודם' on the first step", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "הקודם" })).toBeDisabled();
  });

  it("goes to step 1.1 on 'הבא' and marks 0.1 done", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "הבא" }));
    expect(heading()).toHaveTextContent(findStep("1.1")!.step.title);
    expect(loadProgress().done).toContain("0.1");
    expect(loadProgress().last).toBe("1.1");
  });

  it("navigates to step 4.5 from the nav and marks it current", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "תפריט מודולים" });
    const target = findStep("4.5")!.step;
    const btn = within(nav).getByRole("button", { name: new RegExp(target.title) });
    fireEvent.click(btn);
    expect(heading()).toHaveTextContent(target.title);
    expect(btn).toHaveAttribute("aria-current", "step");
  });

  it("supports RTL arrow keys", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(heading()).toHaveTextContent(findStep("1.1")!.step.title);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(heading()).toHaveTextContent(findStep("0.1")!.step.title);
  });

  it("ignores arrow keys while the drawer is open or in editable content", () => {
    render(<App />);
    const first = findStep("0.1")!.step.title;
    fireEvent.click(screen.getByRole("button", { name: "פתיחת תפריט" }));
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(heading()).toHaveTextContent(first);
    fireEvent.keyDown(window, { key: "Escape" });
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    // jsdom does not implement isContentEditable
    Object.defineProperty(editable, "isContentEditable", { value: true });
    document.body.appendChild(editable);
    fireEvent.keyDown(editable, { key: "ArrowLeft" });
    expect(heading()).toHaveTextContent(first);
    editable.remove();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(heading()).toHaveTextContent(findStep("1.1")!.step.title);
  });

  it("restores the last step on load", () => {
    setLast("4.5");
    render(<App />);
    expect(heading()).toHaveTextContent(findStep("4.5")!.step.title);
  });

  it("shows the finish label on the last step and marks it done", () => {
    const last = allSteps[allSteps.length - 1];
    setLast(last.id);
    render(<App />);
    const finish = screen.getByRole("button", { name: /סיום ההדרכה/ });
    expect(finish).toBeEnabled();
    fireEvent.click(finish);
    expect(loadProgress().done).toContain(last.id);
    expect(screen.getByText(`${loadProgress().done.length}/${allSteps.length}`)).toBeInTheDocument();
  });

  it("falls back to placeholders when media fails to load", () => {
    const { container } = render(<App />);
    const img = container.querySelector("img[data-role='screen']")!;
    fireEvent.error(img);
    expect(screen.getByTestId("screen-placeholder")).toBeInTheDocument();
    const video = container.querySelector("video")!;
    fireEvent.error(video);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByAltText("העוזר הדיגיטלי של EPR מערכות")).toBeInTheDocument();
    expect(screen.getByTestId("caption")).toHaveTextContent(findStep("0.1")!.step.script);
  });

  it("swaps the still avatar for the video once the clip has data", () => {
    const { container } = render(<App />);
    expect(screen.getByAltText("העוזר הדיגיטלי של EPR מערכות")).toBeInTheDocument();
    fireEvent.loadedData(container.querySelector("video")!);
    expect(screen.queryByAltText("העוזר הדיגיטלי של EPR מערכות")).toBeNull();
    expect(container.querySelector("video")).not.toHaveClass("hidden");
  });

  it("renders warning and tip callouts", () => {
    const warned = allSteps.find((s) => s.warning)!;
    const tipped = allSteps.find((s) => s.tip)!;
    setLast(warned.id);
    const { unmount } = render(<App />);
    expect(screen.getByRole("note")).toHaveTextContent(warned.warning!);
    unmount();
    setLast(tipped.id);
    render(<App />);
    expect(screen.getByText(tipped.tip!)).toBeInTheDocument();
  });

  it("resets progress from the nav footer after confirmation", () => {
    const spy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "הבא" }));
    fireEvent.click(screen.getByRole("button", { name: "איפוס התקדמות" }));
    expect(spy).toHaveBeenCalledWith("לאפס את ההתקדמות?");
    expect(loadProgress().done).toEqual([]);
    expect(heading()).toHaveTextContent(findStep("0.1")!.step.title);
    spy.mockRestore();
  });

  it("does not reset when the confirmation is declined", () => {
    const spy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "הבא" }));
    fireEvent.click(screen.getByRole("button", { name: "איפוס התקדמות" }));
    expect(loadProgress().done).toContain("0.1");
    expect(heading()).toHaveTextContent(findStep("1.1")!.step.title);
    spy.mockRestore();
  });

  it("announces step changes via a live region and focuses the title (not on first mount)", () => {
    render(<App />);
    expect(heading()).not.toHaveFocus();
    const live = document.querySelector("[aria-live='polite']")!;
    expect(live).toHaveTextContent(`שלב 1 מתוך ${allSteps.length}: ${findStep("0.1")!.step.title}`);
    fireEvent.click(screen.getByRole("button", { name: "הבא" }));
    expect(live).toHaveTextContent(`שלב 2 מתוך ${allSteps.length}: ${findStep("1.1")!.step.title}`);
    expect(heading()).toHaveFocus();
  });

  it("ignores stale ids when counting progress", () => {
    markDone("99.9");
    markDone("0.1");
    render(<App />);
    expect(screen.getByText(`1/${allSteps.length}`)).toBeInTheDocument();
  });

  it("keeps the screenshot hidden until it loads", () => {
    const { container } = render(<App />);
    const img = container.querySelector("img[data-role='screen']")!;
    expect(img).toHaveClass("invisible");
    fireEvent.load(img);
    expect(img).not.toHaveClass("invisible");
  });

  it("hides the celebration emoji from assistive tech", () => {
    setLast(allSteps[allSteps.length - 1].id);
    render(<App />);
    expect(screen.getByRole("button", { name: "סיום ההדרכה" })).toBeInTheDocument();
  });
});
