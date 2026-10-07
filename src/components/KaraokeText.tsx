import { useMemo } from "react";
import { tokenize } from "../lib/words";

interface Props {
  text: string;
  /** Index of the word being spoken now; -1 when idle. */
  active: number;
  /** Optional word range to render (inclusive), e.g. the current sentence. */
  range?: [number, number];
}

// Script text where the word currently being narrated glows yellow.
export default function KaraokeText({ text, active, range }: Props) {
  const all = useMemo(() => tokenize(text), [text]);
  const tokens = range
    ? all.filter((t, i) => {
        const w = t.word >= 0 ? t.word : (all[i + 1]?.word ?? -1);
        return w >= range[0] && w <= range[1] && !(t.word < 0 && w === range[0]);
      })
    : all;
  return (
    <>
      {tokens.map((t, i) =>
        t.word < 0 ? (
          t.text
        ) : (
          <span key={i} data-word={t.word} className={t.word === active ? "word-active" : t.word < active ? "word-spoken" : undefined}>
            {t.text}
          </span>
        ),
      )}
    </>
  );
}
