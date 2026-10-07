import { useCallback, useEffect, useRef, useState } from "react";
import { allSteps, findStep, modules } from "./content/lessons";
import { loadProgress, markDone, resetProgress, setLast } from "./lib/progress";
import Header from "./components/Header";
import ModuleNav from "./components/ModuleNav";
import StepStage from "./components/StepStage";
import AvatarPanel from "./components/AvatarPanel";
import Controls from "./components/Controls";
import ProcessStepper from "./components/ProcessStepper";
import { moduleIntroUrl } from "./lib/media";
import { isNarrationEnabled, setNarrationEnabled, stopSpeaking } from "./lib/speech";

const AUTO_KEY = "migration-training-auto-v1";
const AUTO_DELAY_MS = 1500;

function loadAuto(): boolean {
  try {
    return window.localStorage.getItem(AUTO_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveAuto(on: boolean): void {
  try {
    window.localStorage.setItem(AUTO_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

function initialIndex(): number {
  const last = loadProgress().last;
  return (last && findStep(last)?.index) || 0;
}

const SKIP_KEYS_IN = new Set(["INPUT", "TEXTAREA", "SELECT", "VIDEO"]);

export default function App() {
  const [index, setIndex] = useState(initialIndex);
  const [done, setDone] = useState<string[]>(() => loadProgress().done);
  const [navOpen, setNavOpen] = useState(false);
  const [replay, setReplay] = useState(0);
  const [navigated, setNavigated] = useState(false);
  const [narrate, setNarrate] = useState(isNarrationEnabled);
  const [autoAdvance, setAutoAdvance] = useState(loadAuto);
  const [activeWord, setActiveWord] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const step = allSteps[index];
  const found = findStep(step.id)!;
  const isFirst = index === 0;
  const isLast = index === allSteps.length - 1;
  const validIds = new Set(allSteps.map((s) => s.id));
  const doneCount = done.filter((id) => validIds.has(id)).length;
  const isModuleStart = found.module.steps[0].id === step.id;
  const introUrl = isModuleStart && found.module.intro ? moduleIntroUrl(found.module.id) : undefined;

  function toggleNarrate() {
    const next = !narrate;
    if (!next) stopSpeaking();
    setNarrationEnabled(next);
    setNarrate(next);
  }

  useEffect(() => {
    setLast(step.id);
    setActiveWord(-1);
    setPaused(false);
    setProgress(0);
    return () => clearTimeout(autoTimer.current);
  }, [step.id, replay]);

  const goNext = useCallback(() => {
    markDone(allSteps[index].id);
    setDone(loadProgress().done);
    if (index < allSteps.length - 1) {
      setIndex(index + 1);
      setNavigated(true);
    }
  }, [index]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
      setNavigated(true);
    }
  }, [index]);

  // Narration finished on its own: move on automatically (when enabled).
  const onNarrationFinished = useCallback(
    (completed: boolean) => {
      setActiveWord(-1);
      clearTimeout(autoTimer.current);
      if (completed && autoAdvance && index < allSteps.length - 1) {
        autoTimer.current = setTimeout(goNext, AUTO_DELAY_MS);
      }
    },
    [autoAdvance, index, goNext],
  );

  function toggleAuto() {
    const next = !autoAdvance;
    if (!next) clearTimeout(autoTimer.current);
    saveAuto(next);
    setAutoAdvance(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") return setNavOpen(false);
      if (navOpen || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || (target?.tagName && SKIP_KEYS_IN.has(target.tagName))) return;
      if (e.key === "ArrowLeft") goNext();
      else if (e.key === "ArrowRight") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, navOpen]);

  function select(id: string) {
    const f = findStep(id);
    if (f) {
      setIndex(f.index);
      setNavigated(true);
    }
    setNavOpen(false);
  }

  function reset() {
    if (!window.confirm("לאפס את ההתקדמות?")) return;
    resetProgress();
    setDone([]);
    setIndex(0);
    setNavOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div aria-live="polite" className="sr-only">
        {`שלב ${index + 1} מתוך ${allSteps.length}: ${step.title}`}
      </div>
      <Header done={doneCount} total={allSteps.length} navOpen={navOpen} onToggleNav={() => setNavOpen((o) => !o)} />
      {/* RTL: nav docks on the right only on wide screens (xl); below that it is a drawer
            opened from the header, so the screenshot gets the full width. The presenter
            (avatar) floats over a corner of the screenshot inside StepStage. */}
      <div className="mx-auto grid w-full max-w-[100rem] flex-1 grid-cols-1 content-start gap-4 p-3 md:gap-6 md:p-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="xl:col-start-1 xl:row-start-1">
          <ModuleNav
            modules={modules}
            currentId={step.id}
            done={done}
            open={navOpen}
            onSelect={select}
            onReset={reset}
            onClose={() => setNavOpen(false)}
          />
        </div>
        <main className="flex min-w-0 flex-col gap-4 xl:col-start-2 xl:row-start-1">
          <ProcessStepper modules={modules} currentId={step.id} done={done} onSelect={select} />
          <StepStage
            key={step.id}
            module={found.module}
            step={step}
            focusTitle={navigated}
            activeWord={activeWord}
            onPrev={goPrev}
            onNext={goNext}
            canPrev={!isFirst}
            canNext={!isLast}
            presenter={
              <AvatarPanel
                key={`${step.id}-${replay}`}
                step={step}
                introUrl={introUrl}
                narrate={narrate}
                onWord={setActiveWord}
                onFinished={onNarrationFinished}
                paused={paused}
                onProgress={setProgress}
              />
            }
          />
          <div className="sticky bottom-0 z-10 -mx-3 bg-white/95 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:mx-0 md:rounded-2xl md:bg-[#f4f5fb]/95 md:shadow-none">
            <Controls
              isFirst={isFirst}
              isLast={isLast}
              finished={done.includes(step.id)}
              onPrev={goPrev}
              onNext={goNext}
              onReplay={() => setReplay((r) => r + 1)}
              narrate={narrate}
              onToggleNarrate={toggleNarrate}
              autoAdvance={autoAdvance}
              onToggleAuto={toggleAuto}
              paused={paused}
              onTogglePause={() => setPaused((v) => !v)}
              progress={progress}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
