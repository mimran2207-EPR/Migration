import { useEffect, useRef, useState } from "react";
import type { Step } from "../content/types";
import { TALK_FRAMES, avatarVideoUrl, hasStepVideo } from "../lib/media";
import { narrate as startNarration, type NarrationControl } from "../lib/narration";
import { stopSpeaking } from "../lib/speech";
import { wordAtProgress } from "../lib/words";

interface Props {
  step: Step;
  /** Module opening video, played before narration on the module's first step. */
  introUrl?: string;
  narrate: boolean;
  onWord?: (index: number) => void;
  /** Narration ended; `completed` is false when it was stopped or blocked. */
  onFinished?: (completed: boolean) => void;
  /** Player pause: freezes the video or narration where it is. */
  paused?: boolean;
  /** Playback position 0..1 for the player progress bar. */
  onProgress?: (fraction: number) => void;
}

// Playback order: the step's own recorded video → the module intro video (first
// step only) followed by narration → narration of the script.
type Phase = "step-video" | "intro-video" | "narration";

// Mouth frame for a 0..1 voice level: closed / half-open / open.
function mouthFor(level: number): "0" | "1" | "2" {
  return level < 0.12 ? "0" : level < 0.34 ? "1" : "2";
}

// Floating 3D presenter card that sits on the screenshot. While narrating, the voice
// level swaps between closed/half/open mouth frames (lip movement) and drives a glow.
// Remount (via `key`) to restart playback for a step.
export default function AvatarPanel({ step, introUrl, narrate, onWord, onFinished, paused = false, onProgress }: Props) {
  // Only request videos that exist: a missing one would load the SPA page instead.
  const [phase, setPhase] = useState<Phase>(() => (hasStepVideo(step.id) ? "step-video" : introUrl ? "intro-video" : "narration"));
  const [videoReady, setVideoReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlRef = useRef<NarrationControl | null>(null);
  const handlersRef = useRef({ onWord, onFinished, onProgress });
  handlersRef.current = { onWord, onFinished, onProgress };

  const videoSrc = phase === "step-video" ? avatarVideoUrl(step.id) : phase === "intro-video" ? introUrl : undefined;

  function videoFailed() {
    setVideoReady(false);
    setPhase(phase === "step-video" && introUrl ? "intro-video" : "narration");
  }

  useEffect(() => {
    if (phase !== "narration" || !narrate) return;
    const ctl = startNarration(step.id, step.script, {
      onProgress: (f) => handlersRef.current.onProgress?.(f),
      onStart: () => setSpeaking(true),
      onEnd: (completed) => {
        setSpeaking(false);
        handlersRef.current.onFinished?.(completed);
      },
      onWord: (i) => handlersRef.current.onWord?.(i),
      onLevel: (v) => {
        const el = cardRef.current;
        if (!el) return;
        el.style.setProperty("--lvl", v.toFixed(3));
        el.dataset.mouth = mouthFor(v);
      },
    });
    controlRef.current = ctl;
    return () => {
      controlRef.current = null;
      ctl();
    };
  }, [phase, narrate, step.id, step.script]);

  // Player pause / resume for whichever is playing (video or narration).
  useEffect(() => {
    const v = videoRef.current;
    if (v && videoReady) {
      if (paused) v.pause();
      else void (v.play() as Promise<void> | undefined)?.catch?.(() => {});
    } else if (controlRef.current) {
      if (paused) controlRef.current.pause?.();
      else controlRef.current.resume?.();
    }
  }, [paused, videoReady]);

  useEffect(() => () => stopSpeaking(), []);

  const status = paused ? "⏸ מושהה" : videoReady ? "▶ מציג סרטון" : speaking ? "🔊 מסביר…" : narrate ? "מוכן" : "🔇 קריינות כבויה";

  return (
    <aside aria-label="יהודה מימראן, המדריך" className="avatar-stage">
      <div ref={cardRef} data-mouth="0" className={`avatar-3d ${speaking ? "is-speaking" : ""}`}>
        {videoSrc && (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            autoPlay
            playsInline
            preload="auto"
            aria-label={phase === "intro-video" ? "סרטון פתיחה של הנושא" : `סרטון הסבר: ${step.title}`}
            className={videoReady ? "avatar-media" : "hidden"}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={videoFailed}
            onTimeUpdate={(e) => {
              // The step's own video speaks the script: drive the karaoke caption from it.
              const v = e.currentTarget;
              if (v.duration > 0) handlersRef.current.onProgress?.(v.currentTime / v.duration);
              if (phase === "step-video" && v.duration > 0) handlersRef.current.onWord?.(wordAtProgress(step.script, v.currentTime / v.duration));
            }}
            onEnded={() => {
              if (phase === "intro-video") {
                setVideoReady(false);
                setPhase("narration");
              } else {
                handlersRef.current.onFinished?.(true);
              }
            }}
          />
        )}
        {!videoReady && (
          <div className="avatar-face">
            {TALK_FRAMES.map((src, i) =>
              i === 0 ? (
                <img key={src} src={src} alt="יהודה מימראן, EPR מערכות" data-speaking={speaking ? "true" : "false"} className="avatar-frame" />
              ) : (
                <img key={src} src={src} alt="" aria-hidden="true" className={`avatar-frame mouth-${i}`} />
              ),
            )}
          </div>
        )}
        <div className="avatar-tag">
          <span className="font-bold">יהודה מימראן</span>
          <span className="text-[0.7em] opacity-90">{status}</span>
        </div>
      </div>
    </aside>
  );
}
