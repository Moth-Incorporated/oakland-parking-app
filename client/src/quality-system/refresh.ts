/** NFR1: refresh visible spot statuses every 5 minutes while the app is in the foreground. */
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface AutoRefresh {
  /** Call after any refresh (manual or automatic) so the next one is 5 minutes away. */
  markRefreshed(): void;
  stop(): void;
}

export function startAutoRefresh(onRefresh: () => void, intervalMs = REFRESH_INTERVAL_MS): AutoRefresh {
  let last = Date.now();
  const run = () => {
    last = Date.now();
    onRefresh();
  };
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') run();
  }, intervalMs);
  // A backgrounded tab may skip timer ticks; catch up as soon as it comes back.
  const onVisible = () => {
    if (document.visibilityState === 'visible' && Date.now() - last >= intervalMs) run();
  };
  document.addEventListener('visibilitychange', onVisible);
  return {
    markRefreshed: () => {
      last = Date.now();
    },
    stop: () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    },
  };
}