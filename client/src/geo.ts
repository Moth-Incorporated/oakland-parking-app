// group spots into bubble and measure distance

import type {LatLng, Spot} from './types';

// At or above this zoom, vacant spots render as individual pins, below it they cluster
export const STREET_ZOOM = 17;

const TILE_SIZE = 256;
const EARTH_RADIUS_MILES = 3958.8;

export interface Cluster extends LatLng {
  count: number;
  spots: Spot[];
}

// convert lat and long into position in pixels on map
export function project(p: LatLng, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((p.latitude * Math.PI) / 180);
  return {
    x: ((p.longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

// adds one spot's latitude to running total (used by reduce)
function addLatitude(sum: number, spot: Spot): number {
  return sum + spot.latitude;
}

// adds one spot's longitude to running total (used by reduce)
function addLongitude(sum: number, spot: Spot): number {
  return sum + spot.longitude;
}

// turn one group of spots into single bubble, placed at the average position of spots
function makeCluster(group: Spot[]): Cluster {
  return {
    latitude: group.reduce(addLatitude, 0) / group.length,
    longitude: group.reduce(addLongitude, 0) / group.length,
    count: group.length,
    spots: group,
  };
}

// lay grid over map
// clusters stay put while panning and only regroup when zoom changes.
export function clusterSpots(spots: Spot[], zoom: number, cellPx = 88): Cluster[] {
  const cells = new Map<string, Spot[]>();
  for (const spot of spots) {
    const { x, y } = project(spot, zoom);
    const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const group = cells.get(key);
    if (group) group.push(spot);
    else cells.set(key, [spot]);
  }
  return [...cells.values()].map(makeCluster);
}

// Haversine formula
export function distanceCalc(a: LatLng, b: LatLng): number {
  function rad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

// format distance
export function formatMiles(miles: number): string {
  if (miles >= 0.1) return `${miles.toFixed(1)} mi`;
  return `${Math.max(50, Math.round((miles * 5280) / 50) * 50)} ft`;
}