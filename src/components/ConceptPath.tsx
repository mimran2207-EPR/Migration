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
const first = () =>
  conceptFromHash(window.location.hash) ?? loadLast() ?? ORDER[0];

// The learning path: one concept at a time — explanation, visual explanation, demonstration and a
// quick check — with a Hebrew narration that keeps going from concept to concept (for listening on
// the road), controllable from the lock screen / car (Media Session).
export default function ConceptPath() {
  const [n, setN] = useState(() =>
    byNumber.has(first()) ? first() : ORDER[0],
  );
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
  const pos = ORDER.indexOf(n);
  const diagram = diagrams.find((x) => x.stage === c.stage);
  const inDiagram = diagram?.layers.some((l) =>
    l.nodes.some((node) => node.concept === n),
  );

  const markKnown = useCallback((num: number) => {
    setKnown((prev) => {
      if (prev.has(num)) return prev;
      const next = new Set(prev).add(num);
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
  const next = useCallback(
    () => pos < ORDER.length - 1 && go(ORDER[pos + 1]),
    [pos, go],
  );
  const prev = useCallback(() => pos > 0 && go(ORDER[pos - 1]), [pos, go]);

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
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const finished = useCallback(() => {
    setPlaying(false);
    markKnown(n);
    if (prefs.auto && pos < ORDER.length - 1) go(ORDER[pos + 1], true);
    else wantPlay.current = false;
  }, [n, pos, prefs.auto, go, markKnown]);

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
          מושג <bdi dir="ltr">{pos + 1}</bdi> מתוך{" "}
          <bdi dir="ltr">{ORDER.length}</bdi> · הבנתם{" "}
          <bdi dir="ltr">{doneCount}</bdi>
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
          <Check key={n} check={d.check} onRight={() => markKnown(n)} />
        </Section>
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={pos === 0}
          className="min-h-12 rounded-full border border-slate-300 px-5 font-bold text-slate-700 disabled:opacity-40"
        >
          → המושג הקודם
        </button>
        <button
          type="button"
          onClick={() => {
            markKnown(n);
            next();
          }}
          className="min-h-12 rounded-full bg-indigo-700 px-6 font-bold text-white hover:bg-indigo-800"
        >
          {pos === ORDER.length - 1
            ? "✓ הבנתי — סיימתי את כל המושגים"
            : "✓ הבנתי, למושג הבא ←"}
        </button>
      </div>

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
                disabled={pos === 0}
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
                disabled={pos === ORDER.length - 1}
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
  onRight,
}: {
  check: { q: string; options: string[]; answer: number; why: string };
  onRight: () => void;
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
            onClick={() => {
              setPicked(k);
              if (k === check.answer) onRight();
            }}
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
  onPick,
  onClose,
}: {
  current: number;
  known: Set<number>;
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
