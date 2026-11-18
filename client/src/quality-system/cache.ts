import type { Snapshot } from '../types';

const KEY = 'moth.lastSnapshot';
/** NFR5: cached data stays usable for 24 hours. */
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function saveSnapshot(snapshot: Snapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ spots: snapshot.spots, fetchedAt: snapshot.fetchedAt }));
  } catch {
    // Storage full or blocked. The app still works, just without an offline copy.
  }
}

export function loadSnapshot(now = Date.now()): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { spots?: unknown; fetchedAt?: unknown };
    if (!Array.isArray(parsed.spots) || typeof parsed.fetchedAt !== 'number') return null;
    if (now - parsed.fetchedAt > MAX_AGE_MS) return null;
    return { spots: parsed.spots, fetchedAt: parsed.fetchedAt, source: 'cache' };
  } catch {
    return null;
  }
}