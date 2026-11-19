import {mockSpots} from './mock';
import {loadSnapshot, saveSnapshot} from './quality-system/cache';
import type {LatLng, Snapshot, Spot, SpotType} from './types';

// the server rejects radius >= 5 miles.
export const MAX_RADIUS_MILES = 4.9;
export const DEFAULT_RADIUS_MILES = 2;

// results within 5 seconds
const TIMEOUT_MS = 5000;

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Request body, in the format from the team's data formats doc.
interface SearchRequest {
  location: { latitude: number; longitude: number };
  filters: {
    'search_radius (miles)': number;
    is_covered: string;
    //is_ev_charging: string;
    is_handicapped: string;
  };
}

// doc's output has id, latitude, longitude. Everything
// else is optional until the team settles the final format.
interface RawSpot {
  id: number;
  latitude: number;
  longitude: number;
  name?: string;
  type?: string;
  status?: string;
  is_free?: boolean;
}

type RawResponse = RawSpot[] | {spots: RawSpot[]; fetchedAt?: number};

const SPOT_TYPES: SpotType[] = ['street', 'garage', 'surface'];

function toSpot(raw: RawSpot): Spot | null {
  if (typeof raw.latitude !== 'number' || typeof raw.longitude !== 'number') return null;
  return {
    id: raw.id,
    name: raw.name ?? `Spot ${raw.id}`,
    latitude: raw.latitude,
    longitude: raw.longitude,
    type: SPOT_TYPES.includes(raw.type as SpotType) ? (raw.type as SpotType) : 'street',
    status: raw.status === 'occupied' ? 'occupied' : 'vacant',
    isFree: raw.is_free ?? false,
  };
}

function isSpot(s: Spot | null): s is Spot {
  return s !== null;
}

async function fetchLive(center: LatLng, radiusMiles: number): Promise<Snapshot> {
  const request: SearchRequest = {
    location: center,
    filters: {
      'search_radius (miles)': Math.min(radiusMiles, MAX_RADIUS_MILES),
      is_covered: 'False',
      //is_ev_charging: 'False',
      is_handicapped: 'False',
    },
  };

  const controller = new AbortController();

  function cancelRequest() {
    controller.abort();
  }
  const timer = window.setTimeout(cancelRequest, TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
    const body = (await response.json()) as RawResponse;
    const raw = Array.isArray(body) ? body : body.spots;
    const sent = Array.isArray(body) ? undefined : body.fetchedAt;
    // Server timestamps may be seconds or milliseconds
    const fetchedAt = sent ? (sent < 1e12 ? sent * 1000 : sent) : Date.now();
    const spots = raw.map(toSpot).filter(isSpot);
    return { spots, fetchedAt, source: 'server' };
  } finally {
    window.clearTimeout(timer);
  }
}


// Order of preference:
// live server, then the last good snapshot, then generated demo data.

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