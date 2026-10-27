import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { concepts } from "../src/content/concepts";
import { scenarios } from "../src/content/practice";
import { makeDrills } from "../src/lib/concepts";

describe("concepts site", () => {
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

  it("practice tab: concepts lab without the course", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "תרגול" }));
    expect(
      screen.getByRole("heading", { name: "מושגים ותרגול" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "הדרכה" })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "סמנו: הבנתי" })[0]);
    expect(screen.getAllByRole("button", { name: "✓ הבנתי" }).length).toBe(1);
    fireEvent.click(screen.getByRole("tab", { name: "תרגול על המוצר" }));
    expect(screen.getByRole("button", { name: "בדיקה" })).toBeDisabled();
  });
});

describe("visual examples", () => {
  it("every concept has an example and every stage a diagram", async () => {
    const { examples } = await import("../src/content/examples");
    const { diagrams } = await import("../src/content/diagrams");
    expect(concepts.filter((c) => !examples[c.n]).map((c) => c.n)).toEqual([]);
    expect(diagrams.map((d) => d.stage)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });
});

describe("learning path", () => {
  it("opens on one concept with its four parts, and moves on", () => {
    window.location.hash = "#/c/1";
    render(<App />);
    expect(screen.getByRole("heading", { name: /ההסבר$/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /הסבר ויזואלי$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /הדגמה$/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /בדקו את עצמכם$/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /הבנתי, למושג הבא/ }));
    expect(window.location.hash).toBe("#/c/2");
    expect(
      JSON.parse(localStorage.getItem("migration-concepts-known-v1")!),
    ).toContain(1);
  });

  it("every concept has a full lesson", async () => {
    const { deepByN } = await import("../src/content/deep");
    expect(concepts.filter((c) => !deepByN.get(c.n)).map((c) => c.n)).toEqual(
      [],
    );
  });
});
