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
test("13 modules, findStep works", () => {
  expect(modules).toHaveLength(13);
  expect(findStep("4.5")?.module.id).toBe("4");
  expect(findStep("99.9")).toBeUndefined();
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
    "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9",
    "9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "9.10", "9.11", "9.12", "9.13", "9.14", "9.15", "9.16",
    "10.1", "10.2", "10.3", "10.4", "10.5",
    "11.1", "11.2", "11.3", "11.4", "11.5", "11.6",
    "12.1", "12.2", "12.3", "12.4", "12.5",
  ]);
});

test("every step has a highlight from its slide", () => {
  allSteps.forEach(s => expect(s.highlight, s.id).toBeDefined());
});

test("warnings on the steps that correct common misreadings of the workbook", () => {
  expect(allSteps.filter(s => s.warning).map(s => s.id)).toEqual(["1.3", "2.4", "3.2", "4.2", "5.4", "8.4", "9.12"]);
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
