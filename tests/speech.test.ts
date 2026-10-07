import { isNarrationEnabled, setNarrationEnabled, speak, stopSpeaking } from "../src/lib/speech";

class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installSynth(voices: { lang: string; name: string }[]) {
  const spoken: FakeUtterance[] = [];
  const fake = {
    speak: vi.fn((u: FakeUtterance) => {
      spoken.push(u);
      u.onstart?.();
      u.onend?.();
    }),
    cancel: vi.fn(),
    getVoices: () => voices,
  };
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  return { fake, spoken };
}

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error test cleanup of the jsdom stub
  delete window.speechSynthesis;
  localStorage.clear();
});

describe("speak", () => {
  it("speaks Hebrew with a Hebrew voice and reports start/end", () => {
    const { spoken, fake } = installSynth([
      { lang: "en-US", name: "en" },
      { lang: "he-IL", name: "Asaf" },
    ]);
    const onStart = vi.fn();
    const onEnd = vi.fn();
    speak("שלום", { onStart, onEnd });
    expect(fake.cancel).toHaveBeenCalled();
    expect(spoken[0].text).toBe("שלום");
    expect(spoken[0].lang).toBe("he-IL");
    expect((spoken[0].voice as { name: string }).name).toBe("Asaf");
    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it("calls onEnd immediately when speech is unsupported", () => {
    const onEnd = vi.fn();
    speak("שלום", { onEnd });
    expect(onEnd).toHaveBeenCalled();
  });

  it("stopSpeaking cancels without throwing", () => {
    const { fake } = installSynth([]);
    stopSpeaking();
    expect(fake.cancel).toHaveBeenCalled();
  });
});

describe("narration preference", () => {
  it("defaults to on and persists off", () => {
    expect(isNarrationEnabled()).toBe(true);
    setNarrationEnabled(false);
    expect(isNarrationEnabled()).toBe(false);
  });
});

describe("voice loading", () => {
  it("waits for the voice list before speaking, then uses the Hebrew voice", async () => {
    let voices: { lang: string; name: string }[] = [];
    const listeners: (() => void)[] = [];
    const spoken: { voice: unknown }[] = [];
    vi.stubGlobal("SpeechSynthesisUtterance", class { lang = ""; rate = 1; voice: unknown = null; onstart = null; onend = null; onerror = null; constructor(public text: string) {} });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (u: { voice: unknown }) => spoken.push(u),
        cancel: () => {},
        getVoices: () => voices,
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener: () => {},
      },
    });
    speak("שלום");
    expect(spoken).toHaveLength(0);
    voices = [{ lang: "he-IL", name: "Asaf" }];
    listeners.forEach((fn) => fn());
    await Promise.resolve();
    await Promise.resolve();
    expect(spoken).toHaveLength(1);
    expect((spoken[0].voice as { name: string }).name).toBe("Asaf");
  });

  it("drops a pending speak when stopped before voices load", async () => {
    const listeners: (() => void)[] = [];
    const spoken: unknown[] = [];
    let voices: { lang: string; name: string }[] = [];
    vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { speak: (u: unknown) => spoken.push(u), cancel: () => {}, getVoices: () => voices, addEventListener: (_: string, fn: () => void) => listeners.push(fn), removeEventListener: () => {} },
    });
    speak("שלום");
    stopSpeaking();
    voices = [{ lang: "he-IL", name: "Asaf" }];
    listeners.forEach((fn) => fn());
    await Promise.resolve();
    await Promise.resolve();
    expect(spoken).toHaveLength(0);
  });
});
