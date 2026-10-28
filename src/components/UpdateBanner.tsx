import { useEffect, useState } from "react";
import { watchForUpdates } from "../lib/update";

// "A new version is out" — shown when the app has been open since before the last update.
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (import.meta.env.PROD) watchForUpdates(() => setReady(true));
  }, []);
  if (!ready) return null;
  return (
    <div role="status" className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-emerald-700 px-4 py-3 text-white shadow-2xl">
      <span aria-hidden className="text-2xl">
        ✨
      </span>
      <p className="flex-1 text-sm font-semibold">יש גרסה חדשה של האתר. רעננו כדי לראות את השינויים.</p>
      <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-full bg-white px-4 text-sm font-bold text-emerald-800">
        רענון
      </button>
    </div>
  );
}
