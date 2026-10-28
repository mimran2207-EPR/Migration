// An installed app (PWA) often stays open in the background for days, so it keeps the version it
// opened with. On every return to the app (and every half hour) we ask the server which build is
// current; when it differs from the running one, `onNew` is called so the app can offer a refresh.

const builtScript = () => document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')?.getAttribute("src") ?? null;

export function watchForUpdates(onNew: () => void): void {
  const running = builtScript();
  if (!running) return; // dev server: nothing to compare
  let told = false;
  const check = async () => {
    if (told || document.visibilityState !== "visible" || !navigator.onLine) return;
    try {
      const html = await (await fetch("/", { cache: "no-store" })).text();
      const live = /src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
      if (live && live !== running) {
        told = true;
        void navigator.serviceWorker?.getRegistration().then((r) => r?.update());
        onNew();
      }
    } catch {
      /* offline or server busy — try again later */
    }
  };
  document.addEventListener("visibilitychange", check);
  window.addEventListener("focus", check);
  setInterval(check, 30 * 60 * 1000);
}
