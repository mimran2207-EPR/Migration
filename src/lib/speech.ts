// Browser text-to-speech narration in Hebrew (Web Speech API).
// Used for steps that have no recorded avatar video. Every call is defensive:
// unsupported browsers, missing Hebrew voices or blocked autoplay just stay silent.

const NARRATION_KEY = "migration-training-narration-v1";

function synth(): SpeechSynthesis | undefined {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : undefined;
  } catch {
    return undefined;
  }
}

export function isSpeechSupported(): boolean {
  return synth() !== undefined && typeof SpeechSynthesisUtterance !== "undefined";
}

// The same Hebrew voice is pinned for the whole session so every step sounds alike.
let pinnedVoice: SpeechSynthesisVoice | undefined;
// Bumped by stopSpeaking so a speak() still waiting for voices is dropped.
let generation = 0;

function hebrewVoice(s: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  if (pinnedVoice) return pinnedVoice;
  pinnedVoice = s.getVoices().find((v) => v.lang.toLowerCase().startsWith("he") || v.lang.toLowerCase().startsWith("iw"));
  return pinnedVoice;
}

// Browsers load the voice list asynchronously; speaking before it arrives falls
// back to a different default voice. Wait for it (bounded) before speaking.
function whenVoicesReady(s: SpeechSynthesis, timeoutMs = 1500): Promise<void> {
  if (s.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      s.removeEventListener?.("voiceschanged", done);
      resolve();
    };
    s.addEventListener?.("voiceschanged", done);
    setTimeout(done, timeoutMs);
  });
}

export interface SpeakHandlers {
  onStart?: () => void;
  /** `completed` is true only when the text was spoken to the end. */
  onEnd?: (completed: boolean) => void;
  /** Character offset of the word being spoken (when the engine reports it). */
  onBoundary?: (charIndex: number) => void;
}

export function speak(text: string, handlers: SpeakHandlers = {}): void {
  const s = synth();
  if (!s || !isSpeechSupported()) {
    handlers.onEnd?.(false);
    return;
  }
  if (s.getVoices().length === 0) {
    const gen = generation;
    void whenVoicesReady(s).then(() => {
      if (gen === generation) say(s, text, handlers);
    });
    return;
  }
  say(s, text, handlers);
}

function say(s: SpeechSynthesis, text: string, handlers: SpeakHandlers): void {
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "he-IL";
    const voice = hebrewVoice(s);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onstart = () => handlers.onStart?.();
    u.onend = () => handlers.onEnd?.(true);
    u.onerror = () => handlers.onEnd?.(false);
    u.onboundary = (e: SpeechSynthesisEvent) => handlers.onBoundary?.(e.charIndex);
    s.speak(u);
  } catch {
    handlers.onEnd?.(false);
  }
}

export function stopSpeaking(): void {
  generation++;
  try {
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}

export function pauseSpeaking(): void {
  try {
    synth()?.pause();
  } catch {
    /* ignore */
  }
}

export function resumeSpeaking(): void {
  try {
    synth()?.resume();
  } catch {
    /* ignore */
  }
}

export function isNarrationEnabled(): boolean {
  try {
    return window.localStorage.getItem(NARRATION_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setNarrationEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(NARRATION_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}
