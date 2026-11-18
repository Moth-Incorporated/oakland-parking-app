import { describe, expect, it } from 'vitest';
import { clusterSpots, formatMiles, haversineMiles } from './geo';
import type { Spot } from './types';

const spot = (id: number, lat: number, lng: number): Spot => ({
  id,
  name: `Spot ${id}`,
  lat,
  lng,
  type: 'street',
  status: 'vacant',
  isFree: false,
});

describe('clusterSpots', () => {
  it('merges nearby spots when zoomed out', () => {
    const clusters = clusterSpots([spot(1, 40.4444, -79.9532), spot(2, 40.4445, -79.9533)], 12);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(2);
  });

  it('keeps distant spots separate when zoomed in', () => {
    const clusters = clusterSpots([spot(1, 40.4444, -79.9532), spot(2, 40.4464, -79.9532)], 18);
    expect(clusters).toHaveLength(2);
  });

  it('never loses spots', () => {
    const spots = Array.from({ length: 50 }, (_, i) => spot(i, 40.44 + i * 0.0004, -79.95 - i * 0.0004));
    for (const zoom of [13, 15, 17]) {
      const total = clusterSpots(spots, zoom).reduce((sum, c) => sum + c.count, 0);
      expect(total).toBe(50);
    }
  });
});

describe('distance helpers', () => {
  it('measures one degree of latitude as about 69 miles', () => {
    expect(haversineMiles({ lat: 40, lng: -80 }, { lat: 41, lng: -80 })).toBeCloseTo(69.09, 1);
  });

  it('formats short and long distances', () => {
    expect(formatMiles(0.04)).toBe('200 ft');
    expect(formatMiles(0.001)).toBe('50 ft');
    expect(formatMiles(0.26)).toBe('0.3 mi');
  });
});