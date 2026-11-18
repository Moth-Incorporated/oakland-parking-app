import { mockSpots } from './mock';
import { loadSnapshot, saveSnapshot } from './quality-system/cache';
import type { LatLng, Snapshot, Spot, SpotType } from './types';

/** C1: the server rejects radius >= 5 miles. */
export const MAX_RADIUS_MILES = 4.9;
export const DEFAULT_RADIUS_MILES = 2;
/** NFR4: results within 5 seconds. */
const TIMEOUT_MS = 5000;

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Request body, in the format from the team's data formats doc.
interface SearchRequest {
  location: { latitude: number; longitude: number };
  filters: {
    'search_radius (miles)': number;
    is_covered: string;
    is_ev_charging: string;
    is_handicapped: string;
  };
}

// One spot in the response. The doc's output has id, latitude, longitude. Everything
// else is optional until the team settles the final format.
interface RawSpot {
  id: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  name?: string;
  type?: string;
  status?: string;
  is_free?: boolean;
}
type RawResponse = RawSpot[] | { spots: RawSpot[]; fetchedAt?: number };

const SPOT_TYPES: SpotType[] = ['street', 'garage', 'surface'];

function toSpot(raw: RawSpot): Spot | null {
  const lat = raw.latitude ?? raw.lat;
  const lng = raw.longitude ?? raw.lng;
  if (lat === undefined || lng === undefined) return null;
  return {
    id: raw.id,
    name: raw.name ?? `Spot ${raw.id}`,
    lat,
    lng,
    type: SPOT_TYPES.includes(raw.type as SpotType) ? (raw.type as SpotType) : 'street',
    status: raw.status === 'occupied' ? 'occupied' : 'vacant',
    isFree: raw.is_free ?? false,
  };
}

async function fetchLive(center: LatLng, radiusMiles: number): Promise<Snapshot> {
  const request: SearchRequest = {
    location: { latitude: center.lat, longitude: center.lng },
    filters: {
      'search_radius (miles)': Math.min(radiusMiles, MAX_RADIUS_MILES),
      is_covered: 'False',
      is_ev_charging: 'False',
      is_handicapped: 'False',
    },
  };
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
    const body = (await res.json()) as RawResponse;
    const raw = Array.isArray(body) ? body : body.spots;
    const sent = Array.isArray(body) ? undefined : body.fetchedAt;
    // Server timestamps may be seconds or milliseconds.
    const fetchedAt = sent ? (sent < 1e12 ? sent * 1000 : sent) : Date.now();
    const spots = raw.map(toSpot).filter((s): s is Spot => s !== null);
    return { spots, fetchedAt, source: 'server' };
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Never throws. Order of preference:
 * live server, then the last good snapshot (FR13 / NFR5), then generated demo data.
 */
export async function getSnapshot(center: LatLng, radiusMiles = DEFAULT_RADIUS_MILES): Promise<Snapshot> {
  if (USE_MOCK) return { spots: mockSpots(center), fetchedAt: Date.now(), source: 'demo' };
  try {
    const snapshot = await fetchLive(center, radiusMiles);
    saveSnapshot(snapshot);
    return snapshot;
  } catch {
    return loadSnapshot() ?? { spots: mockSpots(center), fetchedAt: Date.now(), source: 'demo' };
  }
}