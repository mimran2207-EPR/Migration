import { modules } from "../src/content/lessons";
import { heygenVideos, renderHeygenMarkdown } from "../scripts/heygen";

describe("heygen video list", () => {
  it("has exactly 8 videos: welcome 0.1 + one intro per module 1-7", () => {
    expect(heygenVideos(modules).map((v) => v.file)).toEqual([
      "0.1.mp4",
      "m1.mp4",
      "m2.mp4",
      "m3.mp4",
      "m4.mp4",
      "m5.mp4",
      "m6.mp4",
      "m7.mp4",
    ]);
  });

  it("every intro fits HeyGen's 840-character script limit", () => {
    heygenVideos(modules).forEach((v) => expect(v.script.length).toBeLessThanOrEqual(840));
  });
});

describe("renderHeygenMarkdown", () => {
  const md = renderHeygenMarkdown(modules);

  it("has title, file names, scripts verbatim and durations", () => {
    expect(md).toContain("תסריטים להקלטה ב-HeyGen");
    heygenVideos(modules).forEach((v) => {
      expect(md).toContain(`\`${v.file}\``);
      expect(md).toContain(`> ${v.script}`);
    });
    expect(md.match(/≈ \d+ שניות/g)).toHaveLength(8);
  });

  it("keeps multi-line scripts inside the quote", () => {
    const out = renderHeygenMarkdown([{ id: "9", title: "t", icon: "x", intro: "שורה א\n\nשורה ב", steps: [] }]);
    expect(out).toContain("> שורה א\n>\n> שורה ב");
  });
});
