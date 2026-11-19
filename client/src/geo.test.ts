// A test for geo.ts

import {describe, expect, it} from 'vitest';
import {clusterSpots, formatMiles, distanceCalc, type Cluster} from './geo';
import type {Spot} from './types';

function spot(id: number, latitude: number, longitude: number): Spot {
  return {
    id,
    name: `Spot ${id}`,
    latitude,
    longitude,
    type: 'street',
    status: 'vacant',
    isFree: false,
  };
}

//Helpers

// builds spot at position i in line of spots
function spotAtIndex(_: unknown, i: number): Spot {
  return spot(i, 40.44 + i * 0.0004, -79.95 - i * 0.0004);
}

// adds clusters count to running total
function addCount(sum: number, cluster: Cluster): number {
  return sum + cluster.count;
}


describe('clusterSpots', function () {
  // two spots close together should merge into bubble with count 2 at zoom 12
  it('merges nearby spots when zoomed out', function () {
    const clusters = clusterSpots([spot(1, 40.4444, -79.9532), spot(2, 40.4445, -79.9533)], 12);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(2);
  });

  // spots far apart should stay apart at zoom 18
  it('keeps distant spots separate when zoomed in', function () {
    const clusters = clusterSpots([spot(1, 40.4444, -79.9532), spot(2, 40.4464, -79.9532)], 18);
    expect(clusters).toHaveLength(2);
  });

  // regardless of zoomness, no spots should disappear
  it('never loses spots', function () {
    const spots = Array.from({ length: 50 }, spotAtIndex);
    for (const zoom of [13, 15, 17]) {
      const total = clusterSpots(spots, zoom).reduce(addCount, 0);
      expect(total).toBe(50);
    }
  });
});


describe('distance helpers', function () {
  // method gives real world distance
  it('measures one degree of latitude as about 69 miles', function () {
    expect(distanceCalc({ latitude: 40, longitude: -80 }, { latitude: 41, longitude: -80 })).toBeCloseTo(69.09, 1);
  });

  //format distances
  it('formats short and long distances', function () {
    expect(formatMiles(0.04)).toBe('200 ft');
    expect(formatMiles(0.001)).toBe('50 ft');
    expect(formatMiles(0.26)).toBe('0.3 mi');
  });
});