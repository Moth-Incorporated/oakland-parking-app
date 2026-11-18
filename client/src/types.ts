export type SpotType = 'street' | 'garage' | 'surface';
export type SpotStatus = 'vacant' | 'occupied';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Spot extends LatLng {
  id: number;
  name: string;
  type: SpotType;
  status: SpotStatus;
  isFree: boolean;
}

/** Where a snapshot came from: live server, last-known cache (offline), or generated demo data. */
export type DataSource = 'server' | 'cache' | 'demo';

export interface Snapshot {
  spots: Spot[];
  fetchedAt: number; // epoch ms
  source: DataSource;
}

/** What the map currently shows. The sheet renders from this. */
export interface ViewState {
  zoom: number;
  streetLevel: boolean;
  inView: Spot[]; // vacant spots inside the visible bounds
}