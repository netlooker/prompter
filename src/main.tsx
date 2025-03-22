import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Workbox } from "workbox-window";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/service-worker.js");

  wb.addEventListener("installed", (event) => {
    if (event.isUpdate) {
      if (confirm("New content available. Reload?")) {
        window.location.reload();
      }
    } else {
      console.log("Content cached for offline use.");
    }
  });

  wb.register();
}
