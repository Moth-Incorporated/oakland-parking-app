// refresh visible spot statuses every 5 minutes while the app is in the foreground
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Something that can be called with no inputs and gives nothing back.
interface RefreshCallback {
  (): void;
}

export interface AutoRefresh {
  // Call after any refresh (manual or automatic) so the next one is 5 minutes away
  markRefreshed(): void;
  stop(): void;
}

export function startAutoRefresh(onRefresh: RefreshCallback, intervalMs = REFRESH_INTERVAL_MS): AutoRefresh {
  let last = Date.now();

  // remembers when the refresh happened, then runs the callback
  function run(): void {
    last = Date.now();
    onRefresh();
  }

  // runs on every timer tick, but only refreshes if the page is visible
  function onTick(): void {
    if (document.visibilityState === 'visible') run();
  }

  const timer = window.setInterval(onTick, intervalMs);

  // A backgrounded tab may skip timer ticks; catch up as soon as it comes back.
  function onVisible(): void {
    if (document.visibilityState === 'visible' && Date.now() - last >= intervalMs) run();
  }

  document.addEventListener('visibilitychange', onVisible);

  // called after any refresh, so the catch-up check above knows when the last one happened
  function markRefreshed(): void {
    last = Date.now();
  }

  // turns the auto refresh off
  function stop(): void {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  }

  return {markRefreshed, stop};
}