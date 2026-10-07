import type { Module } from "../src/content/types";

const WORDS_PER_SECOND = 2.5;

function estimateSeconds(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.round(words / WORDS_PER_SECOND);
}

function quote(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

const HEADER = `# תסריטים להקלטה ב-HeyGen

## הוראות

- 8 סרטונים בלבד: סרטון ההיכרות (0.1) וסרטון פתיחה קצר לכל נושא (m1–m7).
- שאר השלבים מוקראים באתר אוטומטית בקריינות בעברית, ואין צורך להקליט אותם.
- אווטאר: האווטאר המצויר של העוזר הדיגיטלי, באותו פורמט לכל הסרטונים.
- פורמט: MP4. שם הקובץ כמופיע ליד כל סרטון.
- מיקום: מניחים את הקבצים בתיקייה \`public/avatar/\`.

הטקסט בציטוט הוא התסריט להדבקה ב-HeyGen, מילה במילה.
`;

interface Video {
  file: string;
  heading: string;
  script: string;
}

export function heygenVideos(modules: Module[]): Video[] {
  const videos: Video[] = [];
  const welcome = modules[0]?.steps[0];
  if (welcome) videos.push({ file: `${welcome.id}.mp4`, heading: `${modules[0].icon} ${welcome.title}`, script: welcome.script });
  for (const m of modules) {
    if (m.intro) videos.push({ file: `m${m.id}.mp4`, heading: `${m.icon} פתיחה: ${m.title}`, script: m.intro });
  }
  return videos;
}

export function renderHeygenMarkdown(modules: Module[]): string {
  const parts: string[] = [HEADER];
  heygenVideos(modules).forEach((v, i) => {
    parts.push(
      `## ${i + 1}. ${v.heading}\n\nקובץ: \`${v.file}\`\n\n${quote(v.script)}\n\nאורך משוער: ≈ ${estimateSeconds(v.script)} שניות\n`,
    );
  });
  return parts.join("\n");
}
