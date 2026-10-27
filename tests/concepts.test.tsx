import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { concepts } from "../src/content/concepts";
import { scenarios } from "../src/content/practice";
import { makeDrills } from "../src/lib/concepts";

describe("concepts lab", () => {
  it("has the workbook concepts and valid practice", () => {
    expect(concepts.length).toBe(110);
    for (const s of scenarios) {
      expect(s.options.length).toBe(4);
      expect(s.answer).toBeGreaterThanOrEqual(0);
      expect(s.answer).toBeLessThan(4);
    }
    for (const d of makeDrills(concepts, 7))
      expect(d.options[d.answer]).toBe(d.concept);
  });

  it("opens from the header tab and marks a concept as understood", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "מושגים ותרגול" }));
    expect(window.location.hash).toBe("#/concepts");
    fireEvent.click(screen.getAllByRole("button", { name: "סמנו: הבנתי" })[0]);
    expect(screen.getAllByRole("button", { name: "✓ הבנתי" }).length).toBe(1);
    fireEvent.click(screen.getByRole("tab", { name: "תרגול על המוצר" }));
    expect(screen.getByRole("button", { name: "בדיקה" })).toBeDisabled();
  });
});
