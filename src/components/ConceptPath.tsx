import { useCallback, useEffect, useRef, useState } from "react";
import { STAGES, concepts } from "../content/concepts";
import { deepByN } from "../content/deep";
import { examples } from "../content/examples";
import { diagrams } from "../content/diagrams";
import { byNumber, loadKnown, saveKnown } from "../lib/concepts";
import {
  RATES,
  audioUrl,
  conceptFromHash,
  loadLast,
  loadPrefs,
  saveLast,
  savePrefs,
} from "../lib/path";
import { speak, stopSpeaking } from "../lib/speech";
import ExampleView from "./ExampleView";
import StageDiagramView from "./StageDiagramView";
import TechText from "./TechText";

const ORDER = concepts.map((c) => c.n);

/** Where to open: the address, else where the learner stopped — moved on to the first concept
 * still to learn when that one is already understood. */
function first(): number {
  const fromHash = conceptFromHash(window.location.hash);
  if (fromHash && ORDER.includes(fromHash)) return fromHash;
  const last = loadLast();
  const start = last && ORDER.includes(last) ? last : ORDER[0];
  const known = loadKnown();
  if (!loadPrefs().skipKnown || !known.has(start)) return start;
  return stepFrom(start, 1, known, true) ?? stepFrom(start, -1, known, true) ?? start;
}

/** The next (dir 1) or previous (dir -1) concept in the path, leaving out understood ones when asked. */
function stepFrom(n: number, dir: 1 | -1, known: Set<number>, skipKnown: boolean): number | null {
  for (let i = ORDER.indexOf(n) + dir; i >= 0 && i < ORDER.length; i += dir) {
    if (!skipKnown || !known.has(ORDER[i])) return ORDER[i];
  }
  return null;
}

// The learning path: one concept at a time — explanation, visual explanation, demonstration and a
// quick check — with a Hebrew narration that keeps going from concept to concept (for listening on
// the road), controllable from the lock screen / car (Media Session).
export default function ConceptPath() {
  const [n, setN] = useState(first);
  const [celebrate, setCelebrate] = useState(false);
  const [known, setKnown] = useState(loadKnown);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ at: 0, of: 0 });
  const [listOpen, setListOpen] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const wantPlay = useRef(false);
  const fallback = useRef(false);

  const c = byNumber.get(n)!;
  const d = deepByN.get(n);
  const diagram = diagrams.find((x) => x.stage === c.stage);
  const inDiagram = diagram?.layers.some((l) =>
    l.nodes.some((node) => node.concept === n),
  );

  const setUnderstood = useCallback((num: number, on: boolean) => {
    setKnown((prev) => {
      if (prev.has(num) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(num);
      else next.delete(num);
      saveKnown(next);
      return next;
    });
  }, []);

  const go = useCallback((num: number, keepPlaying = wantPlay.current) => {
    if (!byNumber.has(num)) return;
    stopSpeaking();
    fallback.current = false;
    wantPlay.current = keepPlaying;
    setN(num);
    window.scrollTo({ top: 0 });
  }, []);
  const nextN = stepFrom(n, 1, known, prefs.skipKnown);
  const prevN = stepFrom(n, -1, known, prefs.skipKnown);
  const left = ORDER.filter((x) => !known.has(x)).length;
  const next = useCallback(() => nextN !== null && go(nextN), [nextN, go]);
  const prev = useCallback(() => prevN !== null && go(prevN), [prevN, go]);

  /** "הבנתי": mark it, never show it again in the path, and move on (or celebrate the end). */
  function understood() {
    const after = new Set(known).add(n);
    setUnderstood(n, true);
    const to = stepFrom(n, 1, after, true) ?? stepFrom(n, -1, after, true);
    if (to === null) {
      stopSpeaking();
      audio.current?.pause();
      wantPlay.current = false;
      setCelebrate(true);
      window.scrollTo({ top: 0 });
    } else go(to);
  }

  // Address and resume point follow the concept; the audio element is reused (keeps playing in the background).
  useEffect(() => {
    saveLast(n);
    window.history.replaceState(null, "", `#/c/${n}`);
    const el = audio.current;
    if (!el) return;
    el.src = audioUrl(n);
    el.playbackRate = prefs.rate;
    setTime({ at: 0, of: 0 });
    if (wantPlay.current) void el.play().catch(() => {});
  }, [n, celebrate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onHash = () => {
      const h = conceptFromHash(window.location.hash);
      if (h && h !== n) go(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [n, go]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = prefs.rate;
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => () => stopSpeaking(), []);

  // Narration ended: continuous listening moves to the next concept still to learn.
  // (Listening doesn't mark it understood — only the learner does.)
  const finished = useCallback(() => {
    setPlaying(false);
    if (prefs.auto && nextN !== null) go(nextN, true);
    else wantPlay.current = false;
  }, [nextN, prefs.auto, go]);

  function toggle() {
    const el = audio.current;
    if (fallback.current) {
      // Browser voice (no recorded audio for this concept).
      stopSpeaking();
      fallback.current = false;
      wantPlay.current = false;
      setPlaying(false);
      return;
    }
    if (!el) return;
    if (el.error) {
      wantPlay.current = true;
      onAudioError();
      return;
    }
    if (el.paused) {
      wantPlay.current = true;
      void el.play().catch(() => {});
    } else {
      wantPlay.current = false;
      el.pause();
    }
  }

  // No recording (yet) for this concept: read it with the browser's Hebrew voice.
  function onAudioError() {
    if (!wantPlay.current || !d) return;
    fallback.current = true;
    setPlaying(true);
    speak(d.narration, {
      onEnd: (completed) => {
        if (!fallback.current) return;
        fallback.current = false;
        if (completed) finished();
        else setPlaying(false);
      },
    });
  }

  // Lock screen / car / headphones controls.
  useEffect(() => {
    const ms =
      typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms || typeof MediaMetadata === "undefined") return;
    ms.metadata = new MediaMetadata({
      title: `${n} · ${c.term}`,
      artist: "מושגי המעבר ל־WEB",
      album: `שלב ${c.stage} · ${STAGES[c.stage]}`,
      artwork: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
    });
    const set = (a: MediaSessionAction, h: (() => void) | null) => {
      try {
        ms.setActionHandler(a, h);
      } catch {
        /* unsupported action */
      }
    };
    set("play", () => void audio.current?.play());
    set("pause", () => audio.current?.pause());
    set("nexttrack", next);
    set("previoustrack", prev);
    set(
      "seekbackward",
      () => audio.current && (audio.current.currentTime -= 10),
    );
    set(
      "seekforward",
      () => audio.current && (audio.current.currentTime += 10),
    );
  }, [n, c, next, prev]);

  const doneCount = known.size;
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (celebrate)
    return (
      <main id="main" className="mx-auto w-full max-w-2xl px-3 py-10 md:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 p-8 text-center text-white shadow-xl">
          <p className="text-6xl" aria-hidden>
            🎉
          </p>
          <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">הבנתם את כל המושגים!</h2>
          <p className="mt-3 text-lg text-emerald-50">
            כל <bdi dir="ltr">{ORDER.length}</bdi> המושגים של מבנה הפיתוח 2026 מסומנים "הבנתי".
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setPrefs((p) => ({ ...p, skipKnown: false }));
              setCelebrate(false);
              go(ORDER[0], false);
            }}
            className="min-h-14 rounded-2xl bg-indigo-700 px-5 font-bold text-white hover:bg-indigo-800"
          >
            לעבור שוב על הכל לחזרה
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("לאפס את כל הסימונים ולהתחיל את המסלול מההתחלה?")) return;
              saveKnown(new Set());
              setKnown(new Set());
              setCelebrate(false);
              go(ORDER[0], false);
            }}
            className="min-h-14 rounded-2xl border-2 border-slate-200 px-5 font-bold text-slate-700 hover:border-indigo-300"
          >
            לאפס ולהתחיל מחדש
          </button>
        </div>
      </main>
    );

  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl px-3 pb-44 pt-3 md:px-6"
    >
      {/* where am I */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="min-h-10 rounded-full bg-indigo-50 px-3 font-semibold text-indigo-800 hover:bg-indigo-100"
        >
          ☰ שלב {c.stage} · {STAGES[c.stage]}
        </button>
        <span className="text-slate-500">
          נשארו <bdi dir="ltr" className="font-bold text-slate-800">{left}</bdi> מושגים · הבנתם{" "}
          <bdi dir="ltr">
            {doneCount}/{ORDER.length}
          </bdi>
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="התקדמות במסלול"
        aria-valuemin={0}
        aria-valuemax={ORDER.length}
        aria-valuenow={doneCount}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${(doneCount / ORDER.length) * 100}%` }}
        />
      </div>

      {/* the concept */}
      <header className="mt-4 rounded-3xl bg-gradient-to-l from-indigo-900 via-indigo-800 to-violet-800 p-5 text-white md:p-7">
        <p className="text-xs font-semibold text-indigo-200">מושג {n}</p>
        <h2
          className="mt-1 text-3xl font-extrabold [overflow-wrap:anywhere] md:text-4xl"
          dir="ltr"
          style={{ unicodeBidi: "isolate", textAlign: "right" }}
        >
          {c.term}
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-indigo-50 md:text-xl">
          {d?.oneLine ?? c.he}
        </p>
        {known.has(n) && (
          <p className="mt-3 inline-block rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-semibold text-emerald-200">
            ✓ הבנתם את המושג הזה
          </p>
        )}
      </header>

      <Section num={1} title="ההסבר">
        <div className="space-y-3 text-[17px] leading-8 text-slate-700">
          {(d?.plain ?? [c.he]).map((p, i) => (
            <p key={i}>
              <TechText text={p} />
            </p>
          ))}
        </div>
      </Section>

      <Section num={2} title="הסבר ויזואלי">
        {d && (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <p className="bg-amber-50 px-4 py-2.5 font-bold text-amber-900">
              💡 {d.analogy.title}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch text-sm">
              <span className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                🏠 בחיים
              </span>
              <span className="bg-slate-50" />
              <span className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                💻 אצלנו במערכת
              </span>
              {d.analogy.rows.map((r, i) => (
                <div key={i} className="contents">
                  <span className="border-t border-slate-100 px-3 py-2.5 text-slate-700">
                    {r.life}
                  </span>
                  <span
                    aria-hidden
                    className="flex items-center border-t border-slate-100 text-slate-300"
                  >
                    ⟵
                  </span>
                  <span className="border-t border-slate-100 px-3 py-2.5 font-semibold text-indigo-900 [overflow-wrap:anywhere]">
                    <TechText text={r.tech} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {diagram && inDiagram && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-slate-600">
              איפה זה יושב במערכת (המושג מסומן בכתום):
            </p>
            <StageDiagramView
              diagram={diagram}
              known={known}
              highlight={n}
              onOpen={(num) => go(num)}
            />
          </div>
        )}
      </Section>

      <Section num={3} title="הדגמה">
        {examples[n] && <ExampleView example={examples[n]} />}
        <div className="mt-3 rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
          <span className="mb-1 block text-xs font-semibold text-emerald-300">
            איך עושים את זה בפועל
          </span>
          <TechText text={c.how} dark />
        </div>
      </Section>

      {d && (
        <Section num={4} title="בדקו את עצמכם">
          <Check key={n} check={d.check} />
        </Section>
      )}

      {/* the decision: understood (never shown again) or not yet (comes back later) */}
      <section aria-label="סיום המושג" className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {known.has(n) ? (
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <p className="flex-1 font-bold text-emerald-800">
              <span className="me-2 inline-flex size-8 items-center justify-center rounded-full bg-emerald-100">✓</span>
              סימנתם שהבנתם את המושג הזה — הוא לא יופיע שוב במסלול.
            </p>
            <button type="button" onClick={() => setUnderstood(n, false)} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-600 hover:border-amber-400 hover:text-amber-700">
              ↺ החזירו אותו למסלול
            </button>
            {nextN !== null && (
              <button type="button" onClick={next} className="min-h-11 rounded-full bg-indigo-700 px-5 text-sm font-bold text-white hover:bg-indigo-800">
                למושג הבא ←
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-l from-emerald-50 to-indigo-50 px-5 pb-3 pt-5">
              <p className="text-xl font-extrabold text-slate-800">הבנתם את המושג?</p>
              <p className="mt-1 text-sm text-slate-600">"הבנתי" מוציא אותו מהמסלול ומההקראה הרצופה — לא תחזרו עליו. "עוד לא" ממשיך הלאה, והמושג יחכה לכם לסבב הבא.</p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-[2fr_1fr]">
              <button type="button" onClick={understood} className="group flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 text-lg font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-xl transition group-hover:scale-110">✓</span>
                הבנתי — לא להציג שוב
              </button>
              <button type="button" onClick={next} disabled={nextN === null} className="min-h-16 rounded-2xl border-2 border-slate-200 px-4 font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-800 disabled:opacity-40">
                עוד לא — אחזור אליו
              </button>
            </div>
          </>
        )}
      </section>
      {prevN !== null && (
        <button type="button" onClick={prev} className="mt-3 min-h-11 rounded-full px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          → למושג הקודם
        </button>
      )}

      {/* player */}
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={finished}
        onError={onAudioError}
        onTimeUpdate={(e) =>
          setTime({
            at: e.currentTarget.currentTime,
            of: e.currentTarget.duration || 0,
          })
        }
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = prefs.rate;
          setTime({ at: 0, of: e.currentTarget.duration || 0 });
        }}
      />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 pt-2">
          <div
            className="flex items-center gap-2 text-[11px] text-slate-500"
            dir="ltr"
          >
            <span>{fmt(time.at)}</span>
            <input
              type="range"
              aria-label="מיקום בהקראה"
              min={0}
              max={time.of || 1}
              step={1}
              value={time.at}
              onChange={(e) =>
                audio.current &&
                (audio.current.currentTime = Number(e.target.value))
              }
              className="h-1 flex-1 accent-indigo-700"
            />
            <span>{fmt(time.of)}</span>
          </div>
          <div className="flex items-center justify-between gap-1 py-2">
            <button
              type="button"
              onClick={() => setListOpen(true)}
              aria-label="רשימת המושגים"
              className="min-h-11 min-w-11 rounded-full text-xl text-slate-600 hover:bg-slate-100"
            >
              ☰
            </button>
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={prevN === null}
                aria-label="המושג הקודם"
                className="min-h-12 min-w-12 rounded-full text-2xl text-slate-700 hover:bg-slate-100 disabled:opacity-30"
              >
                ⏭
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "השהיית ההקראה" : "השמעת ההקראה"}
                className="flex size-14 items-center justify-center rounded-full bg-indigo-700 text-2xl text-white shadow-lg hover:bg-indigo-800"
              >
                {playing ? "⏸" : "▶"}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={nextN === null}
                aria-label="המושג הבא"
                className="min-h-12 min-w-12 rounded-full text-2xl text-slate-700 hover:bg-slate-100 disabled:opacity-30"
              >
                ⏮
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setPrefs((p) => ({
                    ...p,
                    rate: RATES[(RATES.indexOf(p.rate) + 1) % RATES.length],
                  }))
                }
                aria-label="מהירות ההקראה"
                className="min-h-11 rounded-full px-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                dir="ltr"
              >
                {prefs.rate}×
              </button>
              <button
                type="button"
                aria-pressed={prefs.auto}
                onClick={() => setPrefs((p) => ({ ...p, auto: !p.auto }))}
                title="בסוף מושג — להמשיך לבא אחריו"
                className={`min-h-11 rounded-full px-2 text-xs font-bold ${prefs.auto ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {prefs.auto ? "רצוף ✓" : "רצוף"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {listOpen && (
        <ConceptList
          current={n}
          known={known}
          skipKnown={prefs.skipKnown}
          onSkipKnown={(on) => setPrefs((p) => ({ ...p, skipKnown: on }))}
          onPick={(num) => (go(num), setListOpen(false))}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  );
}

function Section({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-800">
        <span className="flex size-8 items-center justify-center rounded-full bg-indigo-700 text-base text-white">
          {num}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Check({
  check,
}: {
  check: { q: string; options: string[]; answer: number; why: string };
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === check.answer;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 font-bold text-slate-800">
        <TechText text={check.q} />
      </p>
      <div className="grid gap-2">
        {check.options.map((o, k) => (
          <button
            key={k}
            type="button"
            disabled={picked !== null}
            onClick={() => setPicked(k)}
            className={`min-h-12 rounded-xl border-2 px-4 py-2 text-start font-semibold transition ${
              picked === null
                ? "border-slate-200 text-slate-700 hover:border-indigo-300"
                : k === check.answer
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : k === picked
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-400"
            }`}
          >
            <TechText text={o} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <p
          role="status"
          className={`mt-3 rounded-xl p-3 text-sm leading-relaxed ${right ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
        >
          <strong>{right ? "נכון! " : "לא בדיוק. "}</strong>
          <TechText text={check.why} />
          {!right && (
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="ms-2 font-bold underline"
            >
              לנסות שוב
            </button>
          )}
        </p>
      )}
    </div>
  );
}

function ConceptList({
  current,
  known,
  skipKnown,
  onSkipKnown,
  onPick,
  onClose,
}: {
  current: number;
  known: Set<number>;
  skipKnown: boolean;
  onSkipKnown: (on: boolean) => void;
  onPick: (n: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>("[aria-current]")
      ?.scrollIntoView?.({ block: "center" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-30 flex justify-start bg-slate-900/40"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-label="רשימת המושגים"
        className="h-full w-[min(24rem,90vw)] overflow-y-auto bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-extrabold text-slate-800">כל המושגים</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="min-h-11 min-w-11 rounded-full text-xl hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={skipKnown} onChange={(e) => onSkipKnown(e.target.checked)} className="size-5 accent-emerald-600" />
          לדלג על מושגים שסימנתי "הבנתי"
        </label>
        {Object.keys(STAGES)
          .map(Number)
          .map((s) => (
            <div key={s} className="mb-4">
              <p className="mb-1 text-xs font-bold text-slate-500">
                שלב {s} · {STAGES[s]}
              </p>
              <ul>
                {concepts
                  .filter((c) => c.stage === s)
                  .map((c) => (
                    <li key={c.n}>
                      <button
                        type="button"
                        aria-current={c.n === current ? "step" : undefined}
                        onClick={() => onPick(c.n)}
                        className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-start text-sm ${c.n === current ? "bg-indigo-700 text-white" : "hover:bg-slate-100"}`}
                      >
                        <span
                          className={`w-5 shrink-0 text-center ${known.has(c.n) ? (c.n === current ? "text-white" : "text-emerald-600") : "text-slate-300"}`}
                        >
                          {known.has(c.n) ? "✓" : "○"}
                        </span>
                        <span
                          className="w-7 shrink-0 text-xs opacity-60"
                          dir="ltr"
                        >
                          {c.n}
                        </span>
                        <span
                          className="min-w-0 truncate font-semibold"
                          dir="ltr"
                        >
                          {c.term}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
