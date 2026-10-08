// Service worker: makes the training installable and usable offline.
// Pages: network first (always the latest version when online), cached copy when offline.
// Built assets: cache first (hashed names). Slides, narration, presenter images and PDFs: network first,
// saved as they are viewed so they are there offline.
// A response that is HTML where media was expected (the SPA fallback for a missing file) is never cached.
const CACHE = "migration-training-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/avatar/fig-0.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const MEDIA = /^\/(assets|screens|narration|avatar|pdf|icons)\//;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }
  if (MEDIA.test(url.pathname)) {
    // Audio asks for byte ranges; we fetch and keep the whole file and answer with it (players accept a full 200).
    const key = new Request(url.pathname);
    const save = (res) => {
      const html = (res.headers.get("content-type") || "").includes("text/html");
      if (res.status === 200 && !html) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(key, copy));
      }
      return res;
    };
    // Built files have a content hash in their name: cache first. Slides, narration and images keep
    // their names when the training is updated: network first, so learners always get the new version.
    const hashed = url.pathname.startsWith("/assets/");
    e.respondWith(
      hashed
        ? caches.match(key).then((hit) => hit || fetch(key).then(save))
        : fetch(key).then(save).catch(() => caches.match(key)),
    );
  }
});
