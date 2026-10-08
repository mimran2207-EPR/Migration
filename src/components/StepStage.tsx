import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Module, Step } from "../content/types";
import { screenUrl } from "../lib/media";
import KaraokeText from "./KaraokeText";
import { DOWNLOADS } from "../content/downloads";

interface Props {
  module: Module;
  step: Step;
  focusTitle?: boolean;
  /** Word being narrated; highlighted in the caption. */
  activeWord?: number;
  /** Floating presenter (avatar) drawn over a corner of the screenshot. */
  presenter?: ReactNode;
  /** Side arrows on the screenshot (previous / next screen). */
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}

function HighlightRing({ step }: { step: Step }) {
  const h = step.highlight;
  if (!h) return null;
  return (
    <div
      data-testid="highlight"
      className="highlight-ring spotlight pointer-events-none absolute"
      style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
      aria-hidden="true"
    />
  );
}

function Placeholder({ module, step }: Props) {
  return (
    <div
      data-testid="screen-placeholder"
      className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#4338ca]/10 to-[#06b6d4]/15 p-6 text-center"
    >
      <span className="text-5xl" aria-hidden="true">
        {module.icon}
      </span>
      <p className="text-xl font-bold text-[#4338ca] md:text-2xl">{step.title}</p>
      <p className="text-sm text-slate-500">צילום המסך לשלב זה יתווסף בקרוב</p>
    </div>
  );
}

// Phones: true below the md breakpoint (768px).
function useIsMobile(): boolean {
  const query = "(max-width: 767px)";
  const get = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  const [mobile, setMobile] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return mobile;
}

// On phones the screenshot is zoomed onto the highlighted area so it is readable;
// returns the frame height and the zoomed image box (px), or null when not zooming.
function useZoom(step: Step, enabled: boolean, frameRef: React.RefObject<HTMLDivElement | null>, ratio: number | null) {
  const [box, setBox] = useState<{ frameH: number; w: number; left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const h = step.highlight;
    const el = frameRef.current;
    if (!enabled || !h || !el || !ratio) return setBox(null);
    const calc = () => {
      const W = el.clientWidth;
      const zoom = Math.min(3, Math.max(1.5, 75 / h.w));
      const w = W * zoom;
      const innerH = w / ratio;
      const frameH = Math.min(W * 0.8, innerH);
      const cx = ((h.x + h.w / 2) / 100) * w;
      const cy = ((h.y + h.h / 2) / 100) * innerH;
      const left = Math.min(0, Math.max(W - w, W / 2 - cx));
      const top = Math.min(0, Math.max(frameH - innerH, frameH / 2 - cy));
      setBox({ frameH, w, left, top });
    };
    calc();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(calc) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [step, enabled, frameRef, ratio]);
  return box;
}

const arrow =
  "absolute top-[16%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-[#4338ca] shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:scale-110 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#4338ca] disabled:pointer-events-none disabled:opacity-0 md:h-14 md:w-14";

export default function StepStage({ module, step, focusTitle = false, activeWord = -1, presenter, onPrev, onNext, canPrev = true, canNext = true }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);
  const showImage = failed !== step.id;
  const isMobile = useIsMobile();
  const [ratio, setRatio] = useState<number | null>(null);
  const [fullView, setFullView] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const zoom = useZoom(step, isMobile && !fullView && showImage, frameRef, ratio);

  return (
    <section aria-labelledby="step-title" className="rounded-2xl bg-white p-3 shadow-sm md:p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="rounded-full bg-[#4338ca]/10 px-3 py-0.5 text-xs font-medium text-[#4338ca]">
          {module.icon} {module.title} · שלב {step.id}
        </span>
        <h2 id="step-title" ref={titleRef} tabIndex={-1} className="text-xl focus:outline-none font-bold text-slate-800 md:text-2xl">
          {step.title}
        </h2>
        {DOWNLOADS[step.id] && (
          <a
            href={`/pdf/${DOWNLOADS[step.id]}.pdf`}
            download
            className="ms-auto rounded-full bg-white px-3 py-1 text-xs font-medium text-[#4338ca] shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            ⬇ הורדת התרשים (PDF)
          </a>
        )}
      </div>

      {/* Width is capped from viewport height so image + ring scale together (keeps % coords exact). */}
      <div className="relative mx-auto w-full max-w-[max(18rem,calc((100vh-17rem)*2.05))]">
        {showImage ? (
          <div ref={frameRef} className="relative overflow-hidden rounded-xl border border-slate-100" style={zoom ? { height: zoom.frameH } : undefined}>
            <div
              className={zoom ? "absolute transition-[left,top] duration-500" : "relative"}
              style={zoom ? { width: zoom.w, left: zoom.left, top: zoom.top } : undefined}
            >
              <img
                key={step.id}
                data-role="screen"
                src={screenUrl(step.id)}
                alt={`צילום מסך: ${step.title}`}
                className={`block w-full ${loaded === step.id ? "" : "invisible"}`}
                onLoad={(e) => {
                  setLoaded(step.id);
                  const im = e.currentTarget;
                  if (im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
                }}
                onError={() => setFailed(step.id)}
              />
              <HighlightRing step={step} />
            </div>
            {isMobile && step.highlight && (
              <button
                type="button"
                onClick={() => setFullView((v) => !v)}
                className="absolute right-2 top-2 z-30 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#4338ca] shadow ring-1 ring-slate-200"
              >
                {fullView ? "🔍 התמקד באזור" : "⤢ מסך מלא"}
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Placeholder module={module} step={step} />
            <HighlightRing step={step} />
          </div>
        )}
        {/* RTL: previous screen on the right edge, next screen on the left edge */}
        {onPrev && (
          <button type="button" aria-label="המסך הקודם" onClick={onPrev} disabled={!canPrev} className={`${arrow} right-1 max-md:hidden md:-right-5`}>
            <span aria-hidden="true">›</span>
          </button>
        )}
        {onNext && (
          <button type="button" aria-label="המסך הבא" onClick={onNext} disabled={!canNext} className={`${arrow} left-1 max-md:hidden md:-left-5`}>
            <span aria-hidden="true">‹</span>
          </button>
        )}
        {presenter && (
          // Always the same corner (bottom-left) so the presenter never jumps between steps.
          <div
            data-testid="presenter-slot"
            style={{ ["--tilt" as string]: -1 }}
            className="presenter-slot absolute bottom-2 left-2 z-20 w-16 md:bottom-0 md:left-1 md:w-[clamp(64px,18%,240px)] md:translate-y-[4%] md:-translate-x-[34%]"
          >
            {presenter}
          </div>
        )}
      </div>

      {step.warning && (
        <div role="note" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span aria-hidden="true">⚠️</span>
          <p>
            <strong>שימו לב: </strong>
            {step.warning}
          </p>
        </div>
      )}
      {step.tip && (
        <div className="mt-4 flex gap-2 rounded-xl border border-[#06b6d4]/50 bg-[#06b6d4]/10 p-3 text-sm text-[#312e81]">
          <span aria-hidden="true">💡</span>
          <p>
            <strong>טיפ: </strong>
            {step.tip}
          </p>
        </div>
      )}

      <p data-testid="caption" className="mt-4 rounded-xl bg-slate-50 p-3 leading-relaxed text-slate-700 md:text-lg">
        <KaraokeText text={step.script} active={activeWord} />
      </p>
    </section>
  );
}
