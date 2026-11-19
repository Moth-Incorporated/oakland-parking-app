import type {LatLng, Spot, SpotType} from './types';

// Seeded random number generator: the same seed always gives the same sequence of numbers.
function mulberry32(seed: number) {
  let a = seed >>> 0;

  // each call returns the next number in the sequence, from 0 up to (not including) 1
  function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return next;
}

const STREETS = [
  'Forbes Ave', 'Fifth Ave', 'Bigelow Blvd', 'Atwood St', 'Meyran Ave',
  'Bouquet St', 'Semple St', 'Sennott St', 'Craig St', 'Bayard St',
];

// Demo spots around a center point. Positions fixed, which spots are occupied change every 30 seconds, pressing refresh visibly does something.
export function mockSpots(center: LatLng, now = Date.now(), count = 160): Spot[] {
  const place = mulberry32(42);
  const flip = mulberry32(Math.floor(now / 30_000));
  const counters: Record<SpotType, number> = { street: 0, garage: 0, surface: 0 };

  // builds the spot with this id. Array.from calls it once for each id from 0 up to count - 1
  function makeSpot(_: unknown, id: number): Spot {
    const r = place();
    const type: SpotType = r < 0.7 ? 'street' : r < 0.85 ? 'garage' : 'surface';
    counters[type] += 1;
    const n = counters[type];
    const latitude = center.latitude + (place() + place() - 1) * 0.009;
    const longitude = center.longitude + (place() + place() - 1) * 0.012;
    const street = STREETS[Math.floor(place() * STREETS.length)];
    const freeRoll = place();
    const name =
      type === 'street' ? `${street}, curb ${n}` : type === 'garage' ? `Oakland Garage ${n}` : `Surface Lot ${n}`;
    return {
      id,
      name,
      latitude,
      longitude,
      type,
      isFree: type === 'garage' ? false : freeRoll < (type === 'street' ? 0.25 : 0.1),
      status: flip() < 0.8 ? 'vacant' : 'occupied',
    };
  }

  return Array.from({ length: count }, makeSpot);
}