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



// changed latitude and longitude vars to be named lat and lng bc that's how server sends it
// seemed easier to change var names on client side than server side
interface RawSpot {
  id: number;
  lat: number;
  lng: number;
  name?: string;
  type?: string;
  status?: string;
  is_free?: boolean;
}

type RawResponse = RawSpot[] | {spots: RawSpot[]; fetchedAt?: number};

const SPOT_TYPES: SpotType[] = ['street', 'garage', 'surface'];

function toSpot(raw: RawSpot): Spot | null {
  if (typeof raw.lat !== 'number' || typeof raw.lng !== 'number') return null;
  return {
    id: raw.id,
    name: raw.name ?? `Spot ${raw.id}`,
    latitude: raw.lat,
    longitude: raw.lng,
    type: SPOT_TYPES.includes(raw.type as SpotType) ? (raw.type as SpotType) : 'street',
    status: raw.status === 'occupied' ? 'occupied' : 'vacant',
    isFree: raw.is_free ?? false,
  };
}

function isSpot(s: Spot | null): s is Spot {
  return s !== null;
}

async function fetchLive(center: LatLng, radiusMiles: number): Promise<Snapshot> {

  // creating url params object so we can pass in the "params" var to the fetch() method url
  // if we're going to add other filters to the search, add them in this URLSearchParams object
  const params = new URLSearchParams({
    lat: String(center.latitude),
    lng: String(center.longitude),
    radius: String(radiusMiles),
  });

  const controller = new AbortController();

  function cancelRequest() {
    controller.abort();
  }
  const timer = window.setTimeout(cancelRequest, TIMEOUT_MS);

  try {
    // using params var in fetch() method url
    const response = await fetch(`${API_BASE}/api/search?${params}`, {
      method: 'GET',
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