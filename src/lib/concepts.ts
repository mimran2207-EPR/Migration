import { concepts, type Concept } from "../content/concepts";

// What the learner marked as understood (or answered correctly), by concept number.
const KEY = "migration-concepts-known-v1";

export function loadKnown(): Set<number> {
  try {
    return new Set((JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as number[]).filter((n) => typeof n === "number"));
  } catch {
    return new Set();
  }
}

export function saveKnown(known: Set<number>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...known]));
  } catch {
    /* ignore */
  }
}

export const byNumber = new Map(concepts.map((c) => [c.n, c]));

/** Short display name: "RDP (Remote Desktop Protocol)" → "RDP". */
export function shortTerm(c: Concept): string {
  return c.term.replace(/\s*\(.*\)\s*$/, "").trim();
}

/** Splits mixed Hebrew/technical text so code-like runs can be shown as code. */
export function codeRuns(text: string): { code: boolean; text: string }[] {
  const parts: { code: boolean; text: string }[] = [];
  const re = /([A-Za-z0-9_$][A-Za-z0-9_$.\-<>(){}[\]#@:/=*'"+&|,!?]*(?:[ ][A-Za-z0-9_$.\-<>(){}[\]#@:/=*'"+&|]+)*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push({ code: false, text: text.slice(last, m.index) });
    // Sentence punctuation right after a term stays plain text: "PowerShell," → "PowerShell" + ",".
    const run = m[0].replace(/[.,:;!?]+$/, "");
    parts.push({ code: true, text: run });
    last = m.index! + run.length;
  }
  if (last < text.length) parts.push({ code: false, text: text.slice(last) });
  return parts;
}

/** Deterministic shuffle (so tests and re-renders are stable for a given seed). */
export function shuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Drill {
  concept: Concept;
  kind: "how" | "he";
  prompt: string;
  options: Concept[];
  answer: number;
}

/** "Which concept is this?" — from the technical how-to (or the Hebrew explanation), 4 options
 * from the same stage when possible, otherwise from neighbouring stages. */
export function makeDrills(pool: Concept[], seed: number): Drill[] {
  return shuffle(pool, seed).map((c, i) => {
    const sameStage = concepts.filter((x) => x.n !== c.n && x.stage === c.stage);
    const near = concepts.filter((x) => x.n !== c.n && Math.abs(x.stage - c.stage) === 1);
    const others = shuffle([...shuffle(sameStage, seed + c.n), ...shuffle(near, seed + c.n * 7)], seed + i).slice(0, 3);
    const options = shuffle([c, ...others], seed * 31 + c.n);
    const kind: Drill["kind"] = i % 3 === 2 ? "he" : "how";
    const raw = kind === "how" ? c.how : c.he;
    // Hide the answer if the text names it.
    const prompt = raw.replaceAll(shortTerm(c), "▢▢▢");
    return { concept: c, kind, prompt, options, answer: options.indexOf(c) };
  });
}
