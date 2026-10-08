import { useEffect, useState } from "react";

// "Install the app" (PWA). Android/Chrome: the browser's own install prompt. iPhone (Safari has no
// prompt): a short how-to. Hidden when already running as an installed app.
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
const isIos = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

export default function InstallButton() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !isIos())) return null;

  async function install() {
    if (prompt) {
      await prompt.prompt();
      setPrompt(null);
    } else setHelp((h) => !h);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={install}
        className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white md:text-sm"
      >
        📲 התקנת האפליקציה
      </button>
      {help && (
        <div role="note" className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl bg-white p-3 text-sm text-slate-700 shadow-lg">
          באייפון: לוחצים על כפתור השיתוף <span aria-hidden="true">⬆️</span> בתחתית Safari, ובוחרים <strong>"הוסף למסך הבית"</strong>.
        </div>
      )}
    </div>
  );
}
