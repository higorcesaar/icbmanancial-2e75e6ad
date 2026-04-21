// PWA registration with safe guards for iframe/preview environments.
// Service workers are intentionally disabled inside Lovable's preview iframe
// (and on preview hostnames) to avoid stale caches and navigation interference.

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
    registerSW({
      immediate: true,
      onNeedRefresh: () => {
        const update = confirm("Uma nova versão está disponível! Deseja atualizar agora?");
        if (update) {
          window.location.reload();
        }
      },
      onOfflineReady: () => {
        console.log("App ready to work offline");
      },
    });
  } catch {
    /* noop */
  }
}

export const PWA_ENABLED = shouldEnablePWA;
