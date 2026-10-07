// Step narration: plays the pre-recorded voice MP3 (`/narration/<id>.mp3`). If the file
// is missing or can't be decoded, falls back to the browser's own Hebrew speech.
// While speaking it reports the current word (karaoke caption) and a 0..1 voice level
// (drives the avatar's "talking" animation).
import { pauseSpeaking, resumeSpeaking, speak, stopSpeaking } from "./speech";
import { wordAtChar, wordAtProgress } from "./words";

export function narrationUrl(id: string): string {
  return `/narration/${id}.mp3`;
}

export interface NarrationHandlers {
  onStart?: () => void;
  /** `completed` is true only when the narration played to the end (not stopped/blocked). */
  onEnd?: (completed: boolean) => void;
  onWord?: (index: number) => void;
  onLevel?: (level: number) => void;
  /** Playback position 0..1 (drives the player progress bar). */
  onProgress?: (fraction: number) => void;
}

/** Calling it stops the narration; it can also pause and resume it. */
export type NarrationControl = (() => void) & { pause: () => void; resume: () => void };

function control(stop: () => void, pause: () => void, resume: () => void): NarrationControl {
  return Object.assign(stop, { pause, resume });
}

let audioCtx: AudioContext | undefined;

// Real voice level from a Web Audio analyser when the audio graph can run; otherwise null
// (caller falls back to a synthetic level). Never routes audio through a suspended context.
function analyserFor(audio: HTMLAudioElement): (() => number) | null {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx ??= new Ctx();
    if (audioCtx.state !== "running") {
      void audioCtx.resume().catch(() => {});
      return null;
    }
    const src = audioCtx.createMediaElementSource(audio);
    const an = audioCtx.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    an.connect(audioCtx.destination);
    const buf = new Uint8Array(an.fftSize);
    let smooth = 0;
    return () => {
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      const raw = Math.min(1, Math.sqrt(sum / buf.length) * 9);
      smooth = smooth * 0.6 + raw * 0.4; // ease out jitter
      return smooth;
    };
  } catch {
    return null;
  }
}

const synthetic = (t: number) => 0.35 + 0.3 * Math.abs(Math.sin(t / 90)) + 0.15 * Math.abs(Math.sin(t / 37));

/** Starts narrating a step; returns a function that stops it. */
export function narrate(id: string, text: string, handlers: NarrationHandlers = {}): NarrationControl {
  let stopped = false;
  let finished = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let audio: HTMLAudioElement | undefined;

  const finish = (completed: boolean) => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    handlers.onLevel?.(0);
    handlers.onEnd?.(completed);
  };

  // A plain interval (not requestAnimationFrame) so tracking keeps going even when
  // the page isn't being painted (background tab, hidden window).
  const loop = (tick: (now: number) => void) => {
    clearInterval(timer);
    timer = setInterval(() => {
      if (finished || stopped) return clearInterval(timer);
      tick(performance.now());
    }, 40);
  };

  const fallback = () => {
    if (stopped) return;
    let speaking = false;
    speak(text, {
      onStart: () => {
        speaking = true;
        handlers.onStart?.();
        handlers.onWord?.(0);
        loop((now) => handlers.onLevel?.(speaking ? synthetic(now) : 0));
      },
      onBoundary: (c) => {
        handlers.onWord?.(wordAtChar(text, c));
        handlers.onProgress?.(Math.min(1, c / Math.max(1, text.length)));
      },
      onEnd: (completed) => {
        speaking = false;
        finish(completed);
      },
    });
  };

  try {
    audio = new Audio(narrationUrl(id));
  } catch {
    fallback();
    return control(
      () => {
        stopped = true;
        stopSpeaking();
        finish(false);
      },
      pauseSpeaking,
      resumeSpeaking,
    );
  }

  const a = audio;
  a.onplaying = () => {
    handlers.onStart?.();
    const level = analyserFor(a);
    loop((now) => {
      if (a.duration > 0) {
        handlers.onWord?.(wordAtProgress(text, a.currentTime / a.duration));
        handlers.onProgress?.(a.currentTime / a.duration);
      }
      handlers.onLevel?.(a.paused ? 0 : level ? level() : synthetic(now));
    });
  };
  a.onended = () => {
    handlers.onProgress?.(1);
    finish(true);
  };
  a.onerror = () => {
    if (!stopped) fallback();
  };
  // Older engines (and jsdom) don't return a promise from play().
  const playing = a.play() as Promise<void> | undefined;
  playing?.catch?.((err: unknown) => {
    // Autoplay blocked until the user interacts: stay silent, "השמע שוב" retries.
    if (err instanceof DOMException && err.name === "NotAllowedError") finish(false);
  });

  return control(
    () => {
      stopped = true;
      a.pause();
      stopSpeaking();
      finish(false);
    },
    () => {
      a.pause();
      pauseSpeaking();
    },
    () => {
      if (a.error) resumeSpeaking();
      else void (a.play() as Promise<void> | undefined)?.catch?.(() => {});
    },
  );
}
