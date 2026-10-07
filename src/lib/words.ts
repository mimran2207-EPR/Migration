// Word timing for the karaoke-style caption. Recorded narration has no word
// timestamps, so the spoken position is estimated from playback progress, weighting
// each word by its length plus the pause its punctuation implies.

export interface Token {
  text: string;
  /** Index among words only; -1 for whitespace tokens. */
  word: number;
}

export function tokenize(text: string): Token[] {
  let w = 0;
  return text
    .split(/(\s+)/)
    .filter((t) => t.length > 0)
    .map((t) => (/^\s+$/.test(t) ? { text: t, word: -1 } : { text: t, word: w++ }));
}

function weight(word: string): number {
  let w = word.replace(/[^\p{L}\p{N}]/gu, "").length + 2;
  if (/[.!?…]["״']?$/.test(word)) w += 7;
  else if (/[,:;]["״']?$/.test(word)) w += 4;
  return w;
}

/** Word index being spoken at `progress` (0..1) through the audio. */
export function wordAtProgress(text: string, progress: number): number {
  const words = tokenize(text).filter((t) => t.word >= 0);
  if (words.length === 0) return -1;
  const weights = words.map((t) => weight(t.text));
  const total = weights.reduce((a, b) => a + b, 0);
  const target = Math.min(Math.max(progress, 0), 1) * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (target < acc) return i;
  }
  return words.length - 1;
}

/** Word index containing character offset `charIndex` (speech-synthesis boundaries). */
export function wordAtChar(text: string, charIndex: number): number {
  let pos = 0;
  let last = -1;
  for (const t of tokenize(text)) {
    if (t.word >= 0) {
      if (charIndex < pos + t.text.length) return t.word;
      last = t.word;
    }
    pos += t.text.length;
  }
  return last;
}

/** [first, last] word index of the sentence that contains word `index`. */
export function sentenceRange(text: string, index: number): [number, number] {
  const words = tokenize(text).filter((t) => t.word >= 0);
  if (index < 0 || index >= words.length) return [-1, -1];
  const ends = (w: string) => /[.!?…]["״']?$/.test(w);
  let from = index;
  while (from > 0 && !ends(words[from - 1].text)) from--;
  let to = index;
  while (to < words.length - 1 && !ends(words[to].text)) to++;
  return [from, to];
}
