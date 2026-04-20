import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { toast } from "@/components/ui/sonner";

createRoot(document.getElementById("root")!).render(<App />);

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator) {
  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
  } else {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        toast.info("Nova versão disponível, atualizando...");
        window.setTimeout(() => {
          void updateSW(true);
        }, 1200);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        const checkForUpdates = () => void registration.update();

        checkForUpdates();
        window.setInterval(checkForUpdates, 60 * 1000);
        window.addEventListener("focus", checkForUpdates);
        window.addEventListener("online", checkForUpdates);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdates();
          }
        });
      },
    });
  }
}
