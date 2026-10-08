// Groups all step scripts into a few long HeyGen videos ("batches", ≤ LIMIT characters each),
// so the presenter records 4 videos instead of 76. scripts/split-batch.py later cuts each
// downloaded batch back into one video per step.
//   npm run batches   → docs/heygen-batches.md (to paste) + docs/heygen-batches.json (for the splitter)
import { writeFileSync } from "node:fs";
import { allSteps } from "../src/content/lessons";

const LIMIT = 4950; // HeyGen allows 5000 characters per video; keep a small margin
const SEP = "\n\n"; // a blank line between steps → a longer pause the splitter can find

type Batch = { n: number; steps: { id: string; title: string; script: string }[] };
const batches: Batch[] = [];
let cur: Batch = { n: 1, steps: [] };
let len = 0;
for (const s of allSteps) {
  const add = s.script.length + (cur.steps.length ? SEP.length : 0);
  if (cur.steps.length && len + add > LIMIT) {
    batches.push(cur);
    cur = { n: cur.n + 1, steps: [] };
    len = 0;
  }
  cur.steps.push({ id: s.id, title: s.title, script: s.script });
  len += s.script.length + (cur.steps.length > 1 ? SEP.length : 0);
}
batches.push(cur);

const text = (b: Batch) => b.steps.map((s) => s.script).join(SEP);
const md: string[] = [
  "# הקלטה מרוכזת ב-HeyGen — מרכז ההדרכה למיגרציה",
  "",
  `מציג: **יהודה מימראן**. במקום ${allSteps.length} סרטונים מקליטים ${batches.length} סרטונים ארוכים, והם מפוצלים אוטומטית לסרטון לכל שלב.`,
  "",
  "## איך מקליטים",
  "",
  "1. ב-HeyGen: Create video, אווטאר **יהודה מימראן**, רקע שחור, פורמט Portrait.",
  "2. מדביקים את הטקסט של הסרטון **כמו שהוא**, כולל השורות הריקות בין השלבים (הן יוצרות הפסקה קצרה שלפיה מפצלים).",
  "3. מורידים ושומרים בשם `batch-<מספר>.mp4` בתיקייה `private/videos/` (למשל `batch-1.mp4`).",
  "4. מריצים: `python scripts/split-batch.py <מספר>` — נוצר סרטון לכל שלב, מעובד ומוכן לאתר.",
  "",
  "## הסרטונים",
  "",
  "| סרטון | שלבים | תווים | אורך משוער |",
  "|---|---|---|---|",
  ...batches.map((b) => {
    const t = text(b);
    const min = Math.round(t.split(/\s+/).length / 2.5 / 60);
    return `| ${b.n} | ${b.steps[0].id} – ${b.steps.at(-1)!.id} (${b.steps.length}) | ${t.length} | ≈ ${min} דקות |`;
  }),
  "",
];
for (const b of batches) {
  md.push(`## סרטון ${b.n}: שלבים ${b.steps[0].id} – ${b.steps.at(-1)!.id}`, "", "קובץ: `batch-" + b.n + ".mp4`", "", "```text", text(b), "```", "");
}
writeFileSync("docs/heygen-batches.md", md.join("\n"), "utf8");
writeFileSync("docs/heygen-batches.json", JSON.stringify(batches, null, 2), "utf8");
console.log(batches.map((b) => `batch ${b.n}: ${b.steps.length} steps, ${text(b).length} chars`).join("\n"));
