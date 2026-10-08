import { useEffect, useRef } from "react";
import type { Module } from "../content/types";
import { stepLabel } from "../content/label";

interface Props {
  modules: Module[];
  currentId: string;
  done: string[];
  onSelect: (stepId: string) => void;
}

type State = "done" | "current" | "todo";

function moduleState(m: Module, currentId: string, done: Set<string>): State {
  if (m.steps.some((s) => s.id === currentId)) return "current";
  return m.steps.every((s) => done.has(s.id)) ? "done" : "todo";
}

const circle: Record<State, string> = {
  done: "bg-[#06b6d4] text-white border-[#06b6d4]",
  current: "muni-gradient text-white border-transparent ring-4 ring-[#06b6d4]/30 scale-110",
  todo: "bg-white text-slate-400 border-slate-300",
};

// E-learning style progress: one numbered circle per topic (process) with a connecting
// line, then the steps of the current topic as smaller circles. Every circle jumps there.
export default function ProcessStepper({ modules, currentId, done, onSelect }: Props) {
  const doneSet = new Set(done);
  const current = modules.find((m) => m.steps.some((s) => s.id === currentId)) ?? modules[0];
  const stepIndex = current.steps.findIndex((s) => s.id === currentId);
  const currentRef = useRef<HTMLLIElement>(null);
  // On a phone only a few topics fit: keep the current one in view (horizontal scroll only).
  useEffect(() => {
    const li = currentRef.current;
    const strip = li?.parentElement;
    if (!li || !strip || strip.scrollWidth <= strip.clientWidth) return;
    li.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [current.id]);

  return (
    <nav aria-label="תהליכי ההדרכה" className="rounded-2xl bg-white px-3 py-3 shadow-sm md:px-5">
      <ol className="flex items-start overflow-x-auto pb-1" data-testid="process-stepper">
        {modules.map((m, i) => {
          const st = moduleState(m, currentId, doneSet);
          return (
            <li key={m.id} ref={st === "current" ? currentRef : undefined} className="flex min-w-[2.6rem] flex-1 items-start md:min-w-[4.5rem]">
              <button
                type="button"
                onClick={() => onSelect(m.steps[0].id)}
                aria-current={st === "current" ? "step" : undefined}
                aria-label={`נושא ${i + 1}: ${m.title}${st === "done" ? " (הושלם)" : ""}`}
                className="group flex w-full flex-col items-center gap-1 focus:outline-none"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition group-hover:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-[#4338ca]/40 md:h-11 md:w-11 md:text-base ${circle[st]}`}
                >
                  {st === "done" ? "✓" : i + 1}
                </span>
                <span className={`text-center text-[0.68rem] leading-tight md:text-xs ${st === "current" ? "font-bold text-[#4338ca]" : "text-slate-500"} max-md:hidden`}>
                  {m.title}
                </span>
              </button>
              {i < modules.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mt-[1rem] h-0.5 min-w-2 flex-1 md:mt-[1.35rem] ${st === "done" ? "bg-[#06b6d4]" : "bg-slate-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-2" data-testid="step-dots">
        <span className="text-xs text-slate-500">
          {current.icon} {current.title} · שלב {stepIndex + 1} מתוך {current.steps.length}
        </span>
        <ol className="flex flex-wrap items-center gap-1.5">
          {current.steps.map((s, i) => {
            const isCur = s.id === currentId;
            const isDone = doneSet.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  aria-current={isCur ? "step" : undefined}
                  aria-label={`שלב ${stepLabel(s.id)}: ${s.title}`}
                  title={s.title}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#4338ca] ${
                    isCur
                      ? "border-[#4338ca] bg-[#4338ca] text-white"
                      : isDone
                        ? "border-[#06b6d4] bg-[#06b6d4]/15 text-[#312e81]"
                        : "border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
