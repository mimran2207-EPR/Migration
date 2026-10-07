import { sentenceRange, tokenize, wordAtChar, wordAtProgress } from "../src/lib/words";

const text = "שלום, אני העוזר הדיגיטלי. בואו נתחיל";

describe("tokenize", () => {
  it("numbers words and keeps whitespace tokens", () => {
    const t = tokenize(text);
    expect(t.filter((x) => x.word >= 0).map((x) => x.text)).toEqual(["שלום,", "אני", "העוזר", "הדיגיטלי.", "בואו", "נתחיל"]);
    expect(t.map((x) => x.text).join("")).toBe(text);
  });
});

describe("wordAtProgress", () => {
  it("starts at the first word, ends at the last and moves forward monotonically", () => {
    expect(wordAtProgress(text, 0)).toBe(0);
    expect(wordAtProgress(text, 1)).toBe(5);
    let prev = 0;
    for (let p = 0; p <= 1; p += 0.05) {
      const i = wordAtProgress(text, p);
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
  });

  it("returns -1 for empty text", () => {
    expect(wordAtProgress("", 0.5)).toBe(-1);
  });
});

describe("wordAtChar", () => {
  it("maps a character offset to its word", () => {
    expect(wordAtChar(text, 0)).toBe(0);
    expect(wordAtChar(text, text.indexOf("העוזר") + 2)).toBe(2);
    expect(wordAtChar(text, text.length + 5)).toBe(5);
  });
});

describe("sentenceRange", () => {
  it("returns the word range of the sentence containing the word", () => {
    expect(sentenceRange(text, 0)).toEqual([0, 3]);
    expect(sentenceRange(text, 4)).toEqual([4, 5]);
    expect(sentenceRange(text, 99)).toEqual([-1, -1]);
  });
});
