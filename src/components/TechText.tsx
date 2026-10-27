import { codeRuns } from "../lib/concepts";

// Mixed Hebrew + technical text: commands, APIs and tool names are shown as code (left-to-right).
export default function TechText({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <>
      {codeRuns(text).map((p, i) =>
        p.code ? (
          <code
            key={i}
            dir="ltr"
            className={`rounded px-1 py-0.5 font-mono [overflow-wrap:anywhere] text-[0.85em] [unicode-bidi:isolate] ${dark ? "bg-white/10 text-emerald-200" : "bg-slate-100 text-indigo-800"}`}
          >
            {p.text}
          </code>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
