import type { Example } from "../content/examples";

const COMMENT = /^\s*(\/\/|--|#|')/;

// One concept's visual example. Sized by its own container (not the window), so it fits a
// narrow card on a wide screen as well as a phone.
export default function ExampleView({ example }: { example: Example }) {
  return (
    <figure className="@container m-0">
      {example.kind === "code" && (
        <CodeExample lang={example.lang} code={example.code} />
      )}
      {example.kind === "compare" && (
        <CompareExample before={example.before} after={example.after} />
      )}
      {example.kind === "flow" && <FlowExample steps={example.steps} />}
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500">
        {example.caption}
      </figcaption>
    </figure>
  );
}

function CodeExample({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#0f172a] ring-1 ring-slate-800">
      <div
        className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5"
        dir="ltr"
      >
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ms-auto font-mono text-[11px] uppercase tracking-wide text-slate-400">
          {lang}
        </span>
      </div>
      <pre
        dir="ltr"
        className="overflow-x-auto p-3 text-start font-mono text-[12px] leading-relaxed text-slate-100 @md:text-[13px]"
      >
        {code.split("\n").map((line, i) => (
          <div
            key={i}
            className={COMMENT.test(line) ? "text-slate-500" : undefined}
          >
            {line || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

function CompareExample({
  before,
  after,
}: {
  before: { title: string; lines: string[] };
  after: { title: string; lines: string[] };
}) {
  return (
    <div className="grid items-stretch gap-2 @md:grid-cols-[1fr_auto_1fr]">
      <Side tone="before" title={before.title} lines={before.lines} />
      <span
        aria-hidden
        className="self-center justify-self-center text-xl text-slate-400"
      >
        <span className="@md:hidden">↓</span>
        <span className="hidden @md:inline">←</span>
      </span>
      <Side tone="after" title={after.title} lines={after.lines} />
    </div>
  );
}

function Side({
  tone,
  title,
  lines,
}: {
  tone: "before" | "after";
  title: string;
  lines: string[];
}) {
  const before = tone === "before";
  return (
    <div
      className={`rounded-xl border p-3 ${before ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}
    >
      <p
        className={`mb-1.5 text-xs font-bold ${before ? "text-rose-700" : "text-emerald-700"}`}
      >
        {before ? "✕ " : "✓ "}
        {title}
      </p>
      <ul className="space-y-1 text-sm text-slate-700">
        {lines.map((l) => (
          <li key={l} className="[overflow-wrap:anywhere]" dir="auto">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlowExample({ steps }: { steps: { label: string; sub?: string }[] }) {
  return (
    <ol className="flex flex-col items-stretch gap-1 @lg:flex-row @lg:items-center">
      {steps.map((s, i) => (
        <li
          key={i}
          className="flex flex-col items-center gap-1 @lg:flex-1 @lg:flex-row"
        >
          <div className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-center">
            <span className="block text-sm font-bold text-indigo-900 [overflow-wrap:anywhere]" dir="auto">
              {s.label}
            </span>
            {s.sub && (
              <span className="block text-[11px] text-indigo-600 [overflow-wrap:anywhere]" dir="auto">
                {s.sub}
              </span>
            )}
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden className="text-indigo-300">
              <span className="@lg:hidden">↓</span>
              <span className="hidden @lg:inline">←</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
