import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
import UpdateBanner from "./components/UpdateBanner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <UpdateBanner />
  </StrictMode>,
);

// Installable app (PWA): the service worker caches what was viewed so it also works offline.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
