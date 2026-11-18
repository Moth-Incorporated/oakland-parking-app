import type { LatLng, Spot } from './types';

/** At or above this zoom, vacant spots render as individual pins (FR8). Below it they cluster. */
export const STREET_ZOOM = 17;

const TILE_SIZE = 256;
const EARTH_RADIUS_MILES = 3958.8;

export interface Cluster extends LatLng {
  count: number;
  spots: Spot[];
}

/** Web Mercator: lat/lng to world pixel coordinates at a zoom level. */
export function project(p: LatLng, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((p.lat * Math.PI) / 180);
  return {
    x: ((p.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/**
 * Groups spots into screen-space grid cells. Because cells are fixed in world
 * pixels, clusters stay put while panning and only regroup when zoom changes.
 */
export function clusterSpots(spots: Spot[], zoom: number, cellPx = 88): Cluster[] {
  const cells = new Map<string, Spot[]>();
  for (const spot of spots) {
    const { x, y } = project(spot, zoom);
    const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const group = cells.get(key);
    if (group) group.push(spot);
    else cells.set(key, [spot]);
  }
  return [...cells.values()].map((group) => ({
    lat: group.reduce((sum, s) => sum + s.lat, 0) / group.length,
    lng: group.reduce((sum, s) => sum + s.lng, 0) / group.length,
    count: group.length,
    spots: group,
  }));
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export function formatMiles(miles: number): string {
  if (miles >= 0.1) return `${miles.toFixed(1)} mi`;
  return `${Math.max(50, Math.round((miles * 5280) / 50) * 50)} ft`;
}