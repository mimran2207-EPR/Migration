import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadProgress, markDone, setLast, resetProgress } from "../src/lib/progress";

const KEY = "migration-training-progress-v1";

describe("progress store", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty progress when nothing stored", () => {
    expect(loadProgress()).toEqual({ done: [] });
  });

  it("markDone persists and dedupes", () => {
    markDone("4.5");
    markDone("4.5");
    markDone("4.6");
    expect(loadProgress().done).toEqual(["4.5", "4.6"]);
    expect(JSON.parse(localStorage.getItem(KEY)!).done).toEqual(["4.5", "4.6"]);
  });

  it("markDone preserves last; setLast preserves done", () => {
    setLast("1.1");
    markDone("1.2");
    expect(loadProgress()).toEqual({ done: ["1.2"], last: "1.1" });
    setLast("1.3");
    expect(loadProgress()).toEqual({ done: ["1.2"], last: "1.3" });
  });

  it("resetProgress removes the key", () => {
    markDone("1.1");
    resetProgress();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(loadProgress()).toEqual({ done: [] });
  });

  it("corrupt JSON returns empty", () => {
    localStorage.setItem(KEY, "{not json");
    expect(loadProgress()).toEqual({ done: [] });
  });

  it("wrong-shape data returns empty; filters non-string ids", () => {
    localStorage.setItem(KEY, JSON.stringify([1, 2]));
    expect(loadProgress()).toEqual({ done: [] });
    localStorage.setItem(KEY, JSON.stringify({ done: "x" }));
    expect(loadProgress()).toEqual({ done: [] });
    localStorage.setItem(KEY, JSON.stringify({ done: ["1.1", 2, null], last: 5 }));
    expect(loadProgress()).toEqual({ done: ["1.1"] });
  });

  it("getItem throwing returns empty without throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress()).toEqual({ done: [] });
    expect(() => markDone("1.1")).not.toThrow();
    expect(() => setLast("1.1")).not.toThrow();
  });

  it("setItem throwing does not throw", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => markDone("1.1")).not.toThrow();
    expect(() => setLast("1.1")).not.toThrow();
  });

  it("removeItem throwing does not throw", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => resetProgress()).not.toThrow();
  });
});
