import InstallButton from "./InstallButton";
import type { View } from "../App";

interface Props {
  done: number;
  total: number;
  navOpen: boolean;
  onToggleNav: () => void;
  view: View;
  onView: (view: View) => void;
}

const TABS: [View, string][] = [
  ["course", "הדרכה"],
  ["concepts", "מושגים ותרגול"],
];

export default function Header({ done, total, navOpen, onToggleNav, view, onView }: Props) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <header className="muni-gradient text-white shadow-md">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          className={`rounded-xl px-2 py-1 text-2xl leading-none hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white xl:hidden ${view === "course" ? "" : "invisible"}`}
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
        <nav aria-label="אזורי האתר" className="flex shrink-0 rounded-full bg-white/15 p-1">
          {TABS.map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-current={view === v ? "page" : undefined}
              onClick={() => onView(v)}
              className={`min-h-9 whitespace-nowrap rounded-full px-3 text-sm font-semibold md:px-4 ${view === v ? "bg-white text-indigo-800" : "text-white hover:bg-white/15"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <InstallButton />
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex" role="group" aria-label="התקדמות">
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
