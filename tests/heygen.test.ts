import { modules } from "../src/content/lessons";
import { heygenVideos, renderHeygenMarkdown } from "../scripts/heygen";

describe("heygen video list", () => {
  it("has one video for the welcome step + one intro per module", () => {
    expect(heygenVideos(modules).map((v) => v.file)).toEqual(["0.1.mp4", ...modules.slice(1).map((m) => `m${m.id}.mp4`)]);
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
    expect(md.match(/≈ \d+ שניות/g)).toHaveLength(modules.length);
  });

  it("keeps multi-line scripts inside the quote", () => {
    const out = renderHeygenMarkdown([{ id: "9", title: "t", icon: "x", intro: "שורה א\n\nשורה ב", steps: [] }]);
    expect(out).toContain("> שורה א\n>\n> שורה ב");
  });
});
