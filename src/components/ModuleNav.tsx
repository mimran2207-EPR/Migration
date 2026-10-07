import { useEffect, useRef } from "react";
import type { Module } from "../content/types";

interface Props {
  modules: Module[];
  currentId: string;
  done: string[];
  open: boolean;
  onSelect: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function ModuleNav({ modules, currentId, done, open, onSelect, onReset, onClose }: Props) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [currentId]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 xl:hidden" aria-hidden="true" onClick={onClose} />
      )}
      <nav
        id="module-nav"
        aria-label="תפריט מודולים"
        className={`fixed inset-y-0 right-0 z-40 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform xl:sticky xl:top-6 xl:bottom-auto xl:z-auto xl:max-h-[calc(100vh-8rem)] xl:max-w-none xl:shrink-0 xl:translate-x-0 xl:self-start xl:rounded-2xl xl:shadow-sm xl:w-auto ${
          open ? "translate-x-0" : "max-xl:invisible translate-x-full"
        }`}
      >
        <div className="muni-gradient flex items-center justify-between px-4 py-3 text-white xl:rounded-t-2xl">
          <span className="font-bold">תוכן ההדרכה</span>
          <button
            type="button"
            className="rounded-lg px-2 text-xl hover:bg-white/15 xl:hidden"
            aria-label="סגירת תפריט"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <ol className="flex-1 space-y-3 overflow-y-auto p-3">
          {modules.map((m) => {
            const completed = m.steps.filter((s) => done.includes(s.id)).length;
            return (
              <li key={m.id}>
                <div className="mb-1 flex items-center gap-2 px-2 text-sm font-bold text-slate-700">
                  <span aria-hidden="true">{m.icon}</span>
                  <span className="flex-1">{m.title}</span>
                  <span className="text-xs font-normal text-slate-400" dir="ltr">
                    {completed}/{m.steps.length}
                  </span>
                </div>
                <ol className="space-y-0.5">
                  {m.steps.map((s) => {
                    const isCurrent = s.id === currentId;
                    const isDone = done.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          ref={isCurrent ? currentRef : undefined}
                          aria-current={isCurrent ? "step" : undefined}
                          onClick={() => onSelect(s.id)}
                          className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#4338ca] ${
                            isCurrent
                              ? "bg-[#4338ca]/10 font-medium text-[#4338ca]"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                              isDone
                                ? "bg-[#06b6d4] text-white"
                                : isCurrent
                                  ? "bg-[#4338ca] text-white"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                            aria-hidden="true"
                          >
                            {isDone ? "✓" : s.id}
                          </span>
                          <span className="flex-1">{s.title}</span>
                          {isDone && <span className="sr-only">(הושלם)</span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ol>
        <div className="border-t border-slate-100 px-4 py-2 text-center">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 underline-offset-2 hover:text-[#4338ca] hover:underline"
          >
            איפוס התקדמות
          </button>
        </div>
      </nav>
    </>
  );
}
