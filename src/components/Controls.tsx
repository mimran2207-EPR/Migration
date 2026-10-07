interface Props {
  isFirst: boolean;
  isLast: boolean;
  finished: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  narrate: boolean;
  onToggleNarrate: () => void;
  autoAdvance: boolean;
  onToggleAuto: () => void;
  paused: boolean;
  onTogglePause: () => void;
  /** Playback position of the current step, 0..1. */
  progress: number;
}

// Media-player style bar (RTL): previous on the right, a big play/pause in the middle,
// next on the left; replay / narration / auto-advance as secondary icon buttons.
const Icon = {
  // In RTL "previous" points right and "next" points left.
  prev: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M6 5h2v14H6zM9.5 12 18 5v14z" transform="matrix(-1 0 0 1 24 0)" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M6 5h2v14H6zM9.5 12 18 5v14z" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" transform="matrix(-1 0 0 1 24 0)" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  ),
  replay: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </svg>
  ),
  soundOn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  ),
  soundOff: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  ),
  auto: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  ),
};

const round =
  "flex items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca] disabled:cursor-not-allowed disabled:opacity-35";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {children}
      <span className="text-[0.68rem] text-slate-500 md:text-xs" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

export default function Controls(p: Props) {
  const toggle = (on: boolean) => (on ? "bg-[#4338ca]/10 text-[#4338ca]" : "bg-slate-100 text-slate-400");
  return (
    <div className="flex flex-col gap-2">
      {/* playback progress of the current step */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="התקדמות ההסבר" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.progress * 100)}>
        <div className="muni-gradient h-full transition-[width] duration-200" style={{ width: `${Math.round(p.progress * 100)}%` }} />
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* secondary (right side in RTL) */}
        <div className="flex items-center gap-2">
          <Labeled label="מההתחלה">
            <button type="button" aria-label="השמע שוב" title="השמע שוב מההתחלה" onClick={p.onReplay} className={`${round} h-10 w-10 bg-slate-100 text-[#4338ca] hover:bg-slate-200`}>
              {Icon.replay}
            </button>
          </Labeled>
          <Labeled label={p.narrate ? "קול" : "מושתק"}>
            <button
              type="button"
              aria-pressed={p.narrate}
              aria-label={p.narrate ? "קריינות פעילה" : "קריינות כבויה"}
              title={p.narrate ? "השתקת הקריינות" : "הפעלת הקריינות"}
              onClick={p.onToggleNarrate}
              className={`${round} h-10 w-10 ${toggle(p.narrate)}`}
            >
              {p.narrate ? Icon.soundOn : Icon.soundOff}
            </button>
          </Labeled>
        </div>

        {/* main transport */}
        <div className="flex items-center gap-3 md:gap-5">
          <Labeled label="הקודם">
            <button type="button" aria-label="הקודם" title="המסך הקודם" onClick={p.onPrev} disabled={p.isFirst} className={`${round} h-11 w-11 bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50`}>
              {Icon.prev}
            </button>
          </Labeled>
          <button
            type="button"
            aria-label={p.paused ? "המשך" : "השהה"}
            title={p.paused ? "המשך" : "השהה"}
            onClick={p.onTogglePause}
            className={`${round} muni-gradient h-14 w-14 text-white shadow-md hover:brightness-105 md:h-16 md:w-16`}
          >
            {p.paused ? Icon.play : Icon.pause}
          </button>
          <Labeled label={p.isLast ? "סיום" : "הבא"}>
            <button
              type="button"
              aria-label={p.isLast ? "סיום ההדרכה" : "הבא"}
              title={p.isLast ? "סיום ההדרכה" : "המסך הבא"}
              onClick={p.onNext}
              className={`${round} h-11 w-11 bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50`}
            >
              {p.isLast ? <span aria-hidden="true">🎉</span> : Icon.next}
            </button>
          </Labeled>
        </div>

        {/* secondary (left side in RTL) */}
        <div className="flex items-center gap-2">
          <Labeled label={p.autoAdvance ? "אוטומטי" : "ידני"}>
            <button
              type="button"
              aria-pressed={p.autoAdvance}
              aria-label={p.autoAdvance ? "מעבר אוטומטי" : "מעבר ידני"}
              title={p.autoAdvance ? "מעבר אוטומטי לשלב הבא (לחצו לביטול)" : "מעבר ידני (לחצו להפעלת מעבר אוטומטי)"}
              onClick={p.onToggleAuto}
              className={`${round} h-10 w-10 ${toggle(p.autoAdvance)}`}
            >
              {Icon.auto}
            </button>
          </Labeled>
        </div>
      </div>

      {p.isLast && p.finished && (
        <p role="status" className="text-center text-sm font-medium text-[#4338ca]">
          כל הכבוד! סיימתם את ההדרכה.
        </p>
      )}
    </div>
  );
}
