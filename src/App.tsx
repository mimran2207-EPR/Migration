import { useEffect, useState } from "react";
import ConceptLab from "./components/ConceptLab";
import ConceptPath from "./components/ConceptPath";
import InstallButton from "./components/InstallButton";
import { stopSpeaking } from "./lib/speech";

type View = "path" | "practice";
const PRACTICE_HASH = "#/practice";
const viewFromHash = (): View =>
  window.location.hash === PRACTICE_HASH ? "practice" : "path";

const TABS: [View, string][] = [
  ["path", "מסלול המושגים"],
  ["practice", "תרגול"],
];

// The site: the concepts of the 2026 development structure — a learning path with narration
// (one concept at a time), and practice.
export default function App() {
  const [view, setView] = useState<View>(viewFromHash);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function change(next: View) {
    stopSpeaking();
    setView(next);
    if (next === "practice")
      window.history.replaceState(null, "", PRACTICE_HASH);
    window.scrollTo(0, 0);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="muni-gradient text-white shadow-md">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold md:text-2xl">
              מושגי המעבר ל־WEB
            </h1>
            <p className="hidden text-sm text-white/85 sm:block">
              EPR מערכות · מבנה הפיתוח 2026
            </p>
          </div>
          <nav
            aria-label="אזורי האתר"
            className="flex shrink-0 rounded-full bg-white/15 p-1"
          >
            {TABS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-current={view === v ? "page" : undefined}
                onClick={() => change(v)}
                className={`min-h-9 whitespace-nowrap rounded-full px-3 text-sm font-semibold md:px-4 ${view === v ? "bg-white text-indigo-800" : "text-white hover:bg-white/15"}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <InstallButton />
        </div>
      </header>
      {view === "path" ? <ConceptPath /> : <ConceptLab />}
    </div>
  );
}
