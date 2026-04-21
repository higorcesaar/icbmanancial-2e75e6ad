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
const shouldEnablePWA =
  !hostname.includes("id-preview--") &&
  !hostname.includes("lovableproject.com") &&
  hostname !== "localhost" &&
  hostname !== "127.0.0.1" &&
  !isInIframe;

let refreshSW: (() => void) | null = null;

export async function setupPWA() {
  if (!("serviceWorker" in navigator)) return;

  if (!shouldEnablePWA) {
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
    const { update } = await registerSW({
      immediate: true,
      onNeedRefresh: () => {
        if (refreshSW) {
          refreshSW();
        }
      },
      onOfflineReady: () => {
        console.log("App ready to work offline");
      },
    });
    refreshSW = update;
  } catch {
    /* noop */
  }
}

export async function updateApp() {
  if (refreshSW) {
    await refreshSW();
  }
}

export const PWA_ENABLED = shouldEnablePWA;
