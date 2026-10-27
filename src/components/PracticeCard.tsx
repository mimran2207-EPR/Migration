import { useState, type ReactNode } from "react";
import TechText from "./TechText";

interface Props {
  /** "1 / 12" style counter label. */
  counter: string;
  badge: string;
  prompt: ReactNode;
  question: string;
  options: string[];
  answer: number;
  /** Shown after checking: why, the concrete technical move. */
  explain: ReactNode;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}

// One practice question: pick an option, check, see why, move on.
export default function PracticeCard({
  counter,
  badge,
  prompt,
  question,
  options,
  answer,
  explain,
  onAnswered,
  onNext,
  isLast,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const right = picked === answer;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
          {badge}
        </span>
        <span className="text-slate-500" dir="ltr">
          {counter}
        </span>
      </div>
      <div className="mb-3 rounded-xl bg-slate-900 p-4 leading-relaxed text-slate-100">
        {prompt}
      </div>
      <p className="mb-3 text-lg font-bold text-slate-800">{question}</p>
      <div
        role="radiogroup"
        aria-label={question}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((o, k) => {
          const isAnswer = checked && k === answer;
          const isWrong = checked && k === picked && k !== answer;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={picked === k}
              disabled={checked}
              onClick={() => setPicked(k)}
              className={`min-h-12 rounded-xl border-2 px-4 py-2 text-start font-semibold transition ${
                isAnswer
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : isWrong
                    ? "border-red-400 bg-red-50 text-red-700"
                    : picked === k
                      ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 text-slate-700 hover:border-indigo-300"
              }`}
            >
              <span dir="ltr" className="[unicode-bidi:isolate]">
                {o}
              </span>
            </button>
          );
        })}
      </div>
      {checked && (
        <div
          role="status"
          className={`mt-4 rounded-xl p-4 text-sm leading-relaxed ${right ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
        >
          <strong>{right ? "נכון! " : "לא בדיוק. "}</strong>
          {explain}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        {checked ? (
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setChecked(false);
              onNext();
            }}
            className="min-h-11 rounded-full bg-indigo-700 px-6 font-bold text-white hover:bg-indigo-800"
          >
            {isLast ? "סיום התרגול" : "לשאלה הבאה"}
          </button>
        ) : (
          <button
            type="button"
            disabled={picked === null}
            onClick={() => {
              setChecked(true);
              onAnswered(picked === answer);
            }}
            className="min-h-11 rounded-full bg-indigo-700 px-6 font-bold text-white hover:bg-indigo-800 disabled:opacity-40"
          >
            בדיקה
          </button>
        )}
      </div>
    </div>
  );
}

export function Tech({ text }: { text: string }) {
  return <TechText text={text} dark />;
}
