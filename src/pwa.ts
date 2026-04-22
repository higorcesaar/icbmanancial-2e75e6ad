// PWA registration with safe guards for iframe/preview environments.
// Service workers are intentionally disabled inside Lovable's preview iframe
// (and on preview hostnames) to avoid stale caches and navigation interference.

import { toast } from "sonner";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const hostname = window.location.hostname;
const isPreviewHost =
  hostname.includes("id-preview--") ||
  hostname.includes("lovableproject.com") ||
  hostname === "localhost" ||
  hostname === "127.0.0.1";

const shouldEnablePWA = !isInIframe && !isPreviewHost;

export async function setupPWA() {
  if (!("serviceWorker" in navigator)) return;

  if (!shouldEnablePWA) {
    // Clean up any previously registered SW in preview/iframe contexts
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* noop */
    }
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");

    const updateSW = registerSW({
      immediate: true,
      // Called when a new service worker is waiting — show user a toast.
      onNeedRefresh() {
        toast("Nova versão disponível ✨", {
          description: "Atualize para ver as novidades.",
          duration: Infinity,
          action: {
            label: "Atualizar",
            onClick: () => updateSW(true),
          },
        });
      },
      onOfflineReady() {
        toast.success("Pronto para uso offline 💖");
      },
      onRegisteredSW(_swUrl, registration) {
        // Periodically check for updates so PWAs left open on phones pick up
        // new versions without needing a full app restart.
        if (!registration) return;
        const checkForUpdate = () => {
          registration.update().catch(() => {
            /* noop */
          });
        };
        // Check every 60 minutes while the app stays open
        setInterval(checkForUpdate, 60 * 60 * 1000);
        // And whenever the tab regains focus
        window.addEventListener("focus", checkForUpdate);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });
      },
    });
  } catch {
    /* noop */
  }
}

export const PWA_ENABLED = shouldEnablePWA;
