import { useEffect, useMemo, useState } from "react";
import { STAGES, concepts, type Concept } from "../content/concepts";
import { scenarios } from "../content/practice";
import { examples } from "../content/examples";
import { diagrams } from "../content/diagrams";
import ExampleView from "./ExampleView";
import StageDiagramView from "./StageDiagramView";
import {
  byNumber,
  loadKnown,
  makeDrills,
  saveKnown,
  shortTerm,
} from "../lib/concepts";
import PracticeCard, { Tech } from "./PracticeCard";
import TechText from "./TechText";

type Mode = "cards" | "product" | "code";
const STAGE_IDS = Object.keys(STAGES).map(Number);
const diagramOf = (stage: number) => diagrams.find((d) => d.stage === stage);

// "מושגים ותרגול": every concept of the development structure with a short explanation and the
// concrete technical move, then practice — situations from the product, and "which concept is
// this code?" drills. Learning by doing, not by reading.
export default function ConceptLab() {
  const [stage, setStage] = useState<number | "all">(0);
  const [mode, setMode] = useState<Mode>("cards");
  const [query, setQuery] = useState("");
  const [known, setKnown] = useState(loadKnown);
  const [seed, setSeed] = useState(() => Date.now() % 1000);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [flash, setFlash] = useState<number | null>(null);

  // A concept opened from the stage picture: bring its card into view and highlight it.
  useEffect(() => {
    if (flash === null) return;
    document
      .getElementById(`concept-${flash}`)
      ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(t);
  }, [flash]);

  function openConcept(n: number) {
    const c = byNumber.get(n);
    if (!c) return;
    setQuery("");
    if (stage !== "all" && stage !== c.stage) setStage(c.stage);
    setFlash(n);
  }

  const inStage = (c: { stage: number }) =>
    stage === "all" || c.stage === stage;
  const q = query.trim().toLowerCase();
  const shown = concepts.filter(
    (c) =>
      inStage(c) &&
      (!q || `${c.term} ${c.he} ${c.how}`.toLowerCase().includes(q)),
  );
  const stageScenarios = scenarios.filter(inStage);
  const drills = useMemo(
    () => makeDrills(concepts.filter(inStage), seed),
    [stage, seed],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const total = mode === "product" ? stageScenarios.length : drills.length;
  const finished = mode !== "cards" && qi >= total;

  function mark(n: number, on: boolean) {
    const next = new Set(known);
    if (on) next.add(n);
    else next.delete(n);
    saveKnown(next);
    setKnown(next);
  }

  function restart(nextMode = mode, nextStage = stage) {
    setMode(nextMode);
    setStage(nextStage);
    setQi(0);
    setScore({ right: 0, total: 0 });
    setSeed((s) => s + 17);
  }

  const knownIn = (s: number) =>
    concepts.filter((c) => c.stage === s && known.has(c.n)).length;
  const countIn = (s: number) => concepts.filter((c) => c.stage === s).length;

  return (
    <main
      id="main"
      className="mx-auto w-full max-w-[90rem] px-3 pb-12 pt-4 md:px-6"
    >
      <section className="rounded-3xl bg-gradient-to-l from-indigo-900 via-indigo-800 to-violet-800 p-5 text-white md:p-8">
        <p className="text-sm font-semibold text-indigo-200">
          מבנה הפיתוח 2026 · {concepts.length} מושגים ב־{STAGE_IDS.length} שלבים
        </p>
        <h2 className="mt-1 text-2xl font-extrabold md:text-4xl">
          מושגים ותרגול
        </h2>
        <p className="mt-2 max-w-3xl text-indigo-100">
          כל מושג: מה זה במשפט אחד, ואיך עושים את זה בפועל — קוד, פקודה או כלי.
          אחר כך מתרגלים על מצבים אמיתיים מהמוצר, ומזהים מושג מתוך הקוד.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div
            className="h-2.5 w-56 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-label="מושגים שהבנתם"
            aria-valuemin={0}
            aria-valuemax={concepts.length}
            aria-valuenow={known.size}
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${(known.size / concepts.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold">
            הבנתם{" "}
            <bdi dir="ltr">
              {known.size}/{concepts.length}
            </bdi>{" "}
            מושגים
          </span>
        </div>
      </section>

      {/* stages */}
      <nav
        aria-label="שלבי מבנה הפיתוח"
        className="-mx-3 mt-4 overflow-x-auto px-3"
      >
        <ol className="flex gap-2 pb-1">
          {[...STAGE_IDS, "all" as const].map((s) => {
            const active = stage === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => restart(mode, s)}
                  className={`min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${active ? "border-indigo-700 bg-indigo-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"}`}
                >
                  {s === "all" ? (
                    "כל השלבים"
                  ) : (
                    <>
                      {s} · {STAGES[s]}{" "}
                      <span
                        className={
                          active ? "text-indigo-200" : "text-slate-400"
                        }
                        dir="ltr"
                      >
                        {knownIn(s)}/{countIn(s)}
                      </span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* modes */}
      <div
        role="tablist"
        aria-label="סוג הלימוד"
        className="mt-4 grid grid-cols-3 rounded-2xl bg-slate-100 p-1 sm:inline-grid"
      >
        {(
          [
            ["cards", "כרטיסי מושג"],
            ["product", "תרגול על המוצר"],
            ["code", "זהו את המושג מהקוד"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => restart(m)}
            className={`min-h-11 rounded-xl px-2 text-[13px] font-semibold leading-tight sm:px-4 sm:text-sm ${mode === m ? "bg-white text-indigo-800 shadow" : "text-slate-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "cards" && (
        <>
          {stage !== "all" && !q && diagramOf(stage) && (
            <div className="mt-4">
              <StageDiagramView
                diagram={diagramOf(stage)!}
                known={known}
                onOpen={openConcept}
              />
            </div>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מושג, כלי או פקודה (למשל SignalR, tenant, Polly)"
            aria-label="חיפוש מושג"
            className="mt-4 block min-h-12 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <ConceptCard
                key={c.n}
                c={c}
                known={known.has(c.n)}
                flash={flash === c.n}
                onKnown={(on) => mark(c.n, on)}
              />
            ))}
          </ul>
          {shown.length === 0 && (
            <p className="mt-6 text-slate-500">לא נמצאו מושגים לחיפוש הזה.</p>
          )}
        </>
      )}

      {mode !== "cards" && (
        <div className="mt-4 max-w-3xl">
          {finished ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-2xl font-extrabold text-slate-800">
                <bdi dir="ltr">
                  {score.right}/{score.total}
                </bdi>{" "}
                תשובות נכונות
              </p>
              <p className="mt-1 text-slate-500">
                {score.right === score.total
                  ? "מצוין — אפשר לעבור לשלב הבא."
                  : "חזרו על המושגים שטעיתם בהם בכרטיסים, ונסו שוב."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => restart()}
                  className="min-h-11 rounded-full bg-indigo-700 px-6 font-bold text-white"
                >
                  תרגול נוסף
                </button>
                <button
                  type="button"
                  onClick={() => restart("cards")}
                  className="min-h-11 rounded-full border border-slate-300 px-6 font-bold text-slate-700"
                >
                  לכרטיסי המושגים
                </button>
              </div>
            </div>
          ) : total === 0 ? (
            <p className="text-slate-500">
              אין עדיין תרגול לשלב הזה. בחרו שלב אחר או "כל השלבים".
            </p>
          ) : mode === "product" ? (
            <PracticeCard
              key={`p-${qi}-${seed}`}
              counter={`${qi + 1} / ${total}`}
              badge={`תרגול על המוצר · שלב ${stageScenarios[qi].stage}`}
              prompt={<p>{stageScenarios[qi].situation}</p>}
              question={stageScenarios[qi].question}
              options={stageScenarios[qi].options}
              answer={stageScenarios[qi].answer}
              explain={
                <>
                  <TechText text={stageScenarios[qi].why} />
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {stageScenarios[qi].concepts
                      .map((n) => byNumber.get(n))
                      .filter(Boolean)
                      .map((c) => (
                        <span
                          key={c!.n}
                          className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                          dir="ltr"
                        >
                          #{c!.n} {shortTerm(c!)}
                        </span>
                      ))}
                  </span>
                  <ExampleFor n={stageScenarios[qi].concepts[0]} />
                </>
              }
              onAnswered={(ok) => {
                setScore((s) => ({
                  right: s.right + (ok ? 1 : 0),
                  total: s.total + 1,
                }));
                if (ok)
                  stageScenarios[qi].concepts
                    .slice(0, 1)
                    .forEach((n) => mark(n, true));
              }}
              onNext={() => setQi(qi + 1)}
              isLast={qi + 1 >= total}
            />
          ) : (
            <PracticeCard
              key={`d-${qi}-${seed}`}
              counter={`${qi + 1} / ${total}`}
              badge={
                drills[qi].kind === "how"
                  ? "זהו את המושג מהקוד"
                  : "זהו את המושג מההסבר"
              }
              prompt={<Tech text={drills[qi].prompt} />}
              question={
                drills[qi].kind === "how"
                  ? "לאיזה מושג שייך המימוש הזה?"
                  : "על איזה מושג מדובר?"
              }
              options={drills[qi].options.map(shortTerm)}
              answer={drills[qi].answer}
              explain={
                <>
                  <bdi dir="ltr" className="font-bold">
                    {drills[qi].concept.term}
                  </bdi>
                  : {drills[qi].concept.he}
                  <ExampleFor n={drills[qi].concept.n} />
                </>
              }
              onAnswered={(ok) => {
                setScore((s) => ({
                  right: s.right + (ok ? 1 : 0),
                  total: s.total + 1,
                }));
                if (ok) mark(drills[qi].concept.n, true);
              }}
              onNext={() => setQi(qi + 1)}
              isLast={qi + 1 >= total}
            />
          )}
        </div>
      )}
    </main>
  );
}

function ExampleFor({ n }: { n: number | undefined }) {
  const example = n === undefined ? undefined : examples[n];
  if (!example) return null;
  return (
    <div className="mt-3 rounded-xl bg-white p-3 text-slate-800 ring-1 ring-slate-200">
      <span className="mb-2 block text-xs font-bold text-indigo-700">
        דוגמה ויזואלית
      </span>
      <ExampleView example={example} />
    </div>
  );
}

function ConceptCard({
  c,
  known,
  flash,
  onKnown,
}: {
  c: Concept;
  known: boolean;
  flash: boolean;
  onKnown: (on: boolean) => void;
}) {
  const example = examples[c.n];
  return (
    <li
      id={`concept-${c.n}`}
      className={`flex min-w-0 scroll-mt-4 flex-col rounded-2xl border bg-white p-4 transition ${known ? "border-emerald-300" : "border-slate-200"} ${flash ? "ring-4 ring-amber-300" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="min-w-0 text-lg font-extrabold text-slate-800 [overflow-wrap:anywhere]"
          dir="ltr"
          style={{ unicodeBidi: "isolate" }}
        >
          {c.term}
        </h3>
        <span
          className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
          dir="ltr"
        >
          #{c.n} · {c.stage}
        </span>
      </div>
      <p className="mt-1 text-slate-700">{c.he}</p>
      {example && (
        <div className="mt-3">
          <span className="mb-1.5 block text-xs font-semibold text-indigo-700">
            דוגמה ויזואלית
          </span>
          <ExampleView example={example} />
        </div>
      )}
      <div className="mb-3 mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-relaxed text-slate-100">
        <span className="mb-1 block text-xs font-semibold text-emerald-300">
          איך עושים את זה בפועל
        </span>
        <TechText text={c.how} dark />
      </div>
      <button
        type="button"
        aria-pressed={known}
        onClick={() => onKnown(!known)}
        className={`mt-auto min-h-10 self-start rounded-full px-4 text-sm font-semibold ${known ? "bg-emerald-600 text-white" : "border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"}`}
      >
        {known ? "✓ הבנתי" : "סמנו: הבנתי"}
      </button>
    </li>
  );
}
