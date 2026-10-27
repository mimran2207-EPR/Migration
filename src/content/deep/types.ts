// The full lesson of one concept in the learning path: explanation, visual analogy, quick check
// and the Hebrew narration script (read aloud by scripts/build-concept-audio.py).
export interface DeepConcept {
  n: number;
  /** The concept in one sentence. */
  oneLine: string;
  /** 3–4 short paragraphs: what it is · why we need it in the migration · how it works in our product · what goes wrong without it. */
  plain: string[];
  /** Visual explanation: everyday life ↔ our system. */
  analogy: { title: string; rows: { life: string; tech: string }[] };
  /** One quick understanding question. */
  check: { q: string; options: string[]; answer: number; why: string };
  /** Spoken Hebrew script for the narration. */
  narration: string;
}
