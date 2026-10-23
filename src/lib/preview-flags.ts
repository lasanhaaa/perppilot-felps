/*
 * One-time UI flags kept in this browser (welcome video seen, promo dismissed).
 * Resetting the preview clears them so a tester sees the first visit again.
 */

export const WELCOME_KEY = "perppilot.welcome-video-seen";
export const PROMO_KEY = "perppilot.promo-dismissed";

const FLAGS = [WELCOME_KEY, PROMO_KEY, "perppilot.top-banner-dismissed"];

export function readFlag(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // storage blocked: the flag only lives for this session
  }
}

export function clearPreviewFlags() {
  try {
    FLAGS.forEach((k) => window.localStorage.removeItem(k));
    window.sessionStorage.removeItem("perppilot.signup-email");
  } catch {
    // storage blocked: nothing was kept
  }
}
