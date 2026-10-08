import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "../src/App";
import { allSteps, modules } from "../src/content/lessons";

beforeEach(() => localStorage.clear());

const title = () => screen.getByRole("heading", { level: 2 });

describe("process stepper", () => {
  it("shows one circle per topic and marks the current one", () => {
    render(<App />);
    const stepper = screen.getByTestId("process-stepper");
    const circles = within(stepper).getAllByRole("button");
    expect(circles).toHaveLength(modules.length);
    expect(circles[0]).toHaveAttribute("aria-current", "step");
  });

  it("jumps to a topic's first step from its circle", () => {
    render(<App />);
    const invoiceTopic = modules.find((m) => m.id === "4")!;
    fireEvent.click(within(screen.getByTestId("process-stepper")).getByRole("button", { name: new RegExp(invoiceTopic.title) }));
    expect(title()).toHaveTextContent(invoiceTopic.steps[0].title);
  });

  it("jumps between steps of the current topic", () => {
    render(<App />);
    fireEvent.click(within(screen.getByTestId("process-stepper")).getByRole("button", { name: /תמונה כללית/ }));
    fireEvent.click(within(screen.getByTestId("step-dots")).getByRole("button", { name: /^שלב 2\.3/ }));
    expect(title()).toHaveTextContent(allSteps.find((s) => s.id === "1.3")!.title);
  });

  it("side arrows move to the previous and next screen", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "המסך הקודם" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "המסך הבא" }));
    expect(title()).toHaveTextContent(allSteps[1].title);
    fireEvent.click(screen.getByRole("button", { name: "המסך הקודם" }));
    expect(title()).toHaveTextContent(allSteps[0].title);
  });
});
