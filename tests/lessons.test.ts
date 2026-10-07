import { modules, allSteps, findStep } from "../src/content/lessons";
test("ids unique and match N.M", () => {
  const ids = allSteps.map(s => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  ids.forEach(id => expect(id).toMatch(/^\d+\.\d+$/));
});
test("every step has a Hebrew script of 20-90 words", () => {
  allSteps.forEach(s => {
    const words = s.script.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(20);
    expect(words).toBeLessThanOrEqual(90);
    expect(s.script).toMatch(/[֐-׿]/);
  });
});
test("8 modules, findStep works", () => {
  expect(modules).toHaveLength(8);
  expect(findStep("4.5")?.module.id).toBe("4");
  expect(findStep("9.9")).toBeUndefined();
});

test("exact ordered list of step ids", () => {
  expect(allSteps.map(s => s.id)).toEqual([
    "0.1",
    "1.1", "1.2", "1.3", "1.4", "1.5",
    "2.1", "2.2", "2.3", "2.4", "2.5", "2.6",
    "3.1", "3.2", "3.3", "3.4",
    "4.1", "4.2", "4.3", "4.4", "4.5",
    "5.1", "5.2", "5.3", "5.4", "5.5", "5.6",
    "6.1", "6.2", "6.3", "6.4", "6.5", "6.6",
    "7.1", "7.2",
  ]);
});

test("every step has a highlight from its slide", () => {
  allSteps.forEach(s => expect(s.highlight, s.id).toBeDefined());
});

test("warnings on the steps that correct common misreadings of the workbook", () => {
  expect(allSteps.filter(s => s.warning).map(s => s.id)).toEqual(["1.3", "2.4", "3.2", "4.2", "5.4"]);
});

it.each(allSteps)("step $id: Hebrew script of 20-90 words, highlight inside the screen", (s) => {
  const words = s.script.trim().split(/\s+/).length;
  expect(words).toBeGreaterThanOrEqual(20);
  expect(words).toBeLessThanOrEqual(90);
  expect(s.script).toMatch(/[֐-׿]/);
  if (s.highlight) {
    const { x, y, w, h } = s.highlight;
    expect(Math.min(x, y, w, h)).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(100);
    expect(y + h).toBeLessThanOrEqual(100);
  }
});

test("no warning starts with the duplicated 'שימו לב' prefix", () => {
  for (const s of allSteps) if (s.warning) expect(s.warning.startsWith("שימו לב")).toBe(false);
});
