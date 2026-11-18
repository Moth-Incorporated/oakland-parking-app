import type { LatLng, Spot, SpotType } from './types';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREETS = [
  'Forbes Ave', 'Fifth Ave', 'Bigelow Blvd', 'Atwood St', 'Meyran Ave',
  'Bouquet St', 'Semple St', 'Sennott St', 'Craig St', 'Bayard St',
];

/**
 * Demo spots around a center point. Positions are fixed; which spots are
 * occupied changes every 30 seconds, so pressing Refresh visibly does something.
 */
export function mockSpots(center: LatLng, now = Date.now(), count = 160): Spot[] {
  const place = mulberry32(42);
  const flip = mulberry32(Math.floor(now / 30_000));
  const counters: Record<SpotType, number> = { street: 0, garage: 0, surface: 0 };

  return Array.from({ length: count }, (_, id) => {
    const r = place();
    const type: SpotType = r < 0.7 ? 'street' : r < 0.85 ? 'garage' : 'surface';
    counters[type] += 1;
    const n = counters[type];
    const lat = center.lat + (place() + place() - 1) * 0.009;
    const lng = center.lng + (place() + place() - 1) * 0.012;
    const street = STREETS[Math.floor(place() * STREETS.length)];
    const freeRoll = place();
    const name =
      type === 'street' ? `${street}, curb ${n}` : type === 'garage' ? `Oakland Garage ${n}` : `Surface Lot ${n}`;
    return {
      id,
      name,
      lat,
      lng,
      type,
      isFree: type === 'garage' ? false : freeRoll < (type === 'street' ? 0.25 : 0.1),
      status: flip() < 0.8 ? 'vacant' : 'occupied',
    };
  });
}