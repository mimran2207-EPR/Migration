interface Props {
  done: number;
  total: number;
  navOpen: boolean;
  onToggleNav: () => void;
}

export default function Header({ done, total, navOpen, onToggleNav }: Props) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <header className="muni-gradient text-white shadow-md">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          className="rounded-xl px-2 py-1 text-2xl leading-none hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white xl:hidden"
          aria-label={navOpen ? "סגירת תפריט" : "פתיחת תפריט"}
          aria-expanded={navOpen}
          aria-controls="module-nav"
          onClick={onToggleNav}
        >
          ☰
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold md:text-2xl">מעבר מאקסס ל־WEB</h1>
          <p className="hidden text-sm text-white/85 sm:block">EPR מערכות · מסלול לימוד צעד אחר צעד</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1" role="group" aria-label="התקדמות">
          <span className="text-sm font-medium" dir="ltr">
            {done}/{total}
          </span>
          <div
            className="h-2 w-24 overflow-hidden rounded-full bg-white/30 md:w-40"
            role="progressbar"
            aria-label="שלבים שהושלמו"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}
