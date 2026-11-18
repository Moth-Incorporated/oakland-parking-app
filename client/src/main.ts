import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/app.css';

import { DEFAULT_RADIUS_MILES, getSnapshot } from './api';
import { haversineMiles } from './geo';
import { startAutoRefresh } from './quality-system/refresh';
import type { LatLng, Snapshot, Spot } from './types';
import { Banner } from './ui/banner';
import { Drawer } from './ui/drawer';
import { byId } from './ui/dom';
import { hydrateIcons } from './ui/icons';
import { ParkingMap } from './ui/map';
import { SearchOverlay } from './ui/search';
import { Sheet } from './ui/sheet';
import { StatusChip } from './ui/status';

/** Cathedral of Learning. The app is for Oakland, so this is the fallback center. */
const OAKLAND: LatLng = { lat: 40.4444, lng: -79.9532 };
const NEAR_CAMPUS_MILES = 3;
const DEFAULT_ZOOM = 16;

hydrateIcons();

const banner = new Banner(byId('banner'));
const status = new StatusChip(byId('status-chip'));
const refreshBtn = byId<HTMLButtonElement>('refresh-btn');

let userPos: LatLng | null = null;
let current: Snapshot | null = null;
let selected: Spot | null = null;
let loading = false;

/** The point distances are measured from: the user if they are near campus, otherwise campus itself. */
const origin = (): LatLng => (userPos && haversineMiles(userPos, OAKLAND) <= NEAR_CAMPUS_MILES ? userPos : OAKLAND);

const sheet = new Sheet(byId('sheet'), OAKLAND, {
  onZoomIn: () => map.zoomToStreets(),
  onSelect: (spot) => selectSpot(spot),
  onCloseDetail: () => clearSelection(true),
  onBanner: (message) => banner.show(message),
});

// Lets the banner and Leaflet's controls sit above the sheet however tall it is.
const sheetEl = byId('sheet');
new ResizeObserver(() => document.documentElement.style.setProperty('--sheet-h', `${sheetEl.offsetHeight}px`)).observe(sheetEl);

const map = new ParkingMap(byId('map'), OAKLAND, {
  onSelect: (spot) => selectSpot(spot),
  onViewChange: (view) => sheet.update(view),
  onBackgroundTap: () => (selected ? clearSelection(false) : sheet.collapse()),
});

function selectSpot(spot: Spot): void {
  selected = spot;
  sheet.showDetail(spot);
  map.select(spot.id);
  map.focusSpot(spot);
}

function clearSelection(moveFocus: boolean): void {
  selected = null;
  sheet.closeDetail(moveFocus);
  map.select(null);
}

const auto = startAutoRefresh(() => void refresh(false));

async function refresh(manual: boolean): Promise<void> {
  if (loading) return;
  loading = true;
  refreshBtn.disabled = true;
  refreshBtn.dataset.loading = 'true';
  status.update(current?.source ?? 'server', current?.fetchedAt ?? Date.now(), true);

  const snapshot = await getSnapshot(origin(), DEFAULT_RADIUS_MILES);
  current = snapshot;
  map.setSpots(snapshot.spots);
  sheet.setFetchedAt(snapshot.fetchedAt);
  status.update(snapshot.source, snapshot.fetchedAt, false);

  loading = false;
  refreshBtn.disabled = false;
  delete refreshBtn.dataset.loading;
  auto.markRefreshed();

  if (selected && !snapshot.spots.some((s) => s.id === selected!.id && s.status === 'vacant')) {
    banner.show('That spot was just taken.');
    clearSelection(false);
  } else if (manual && snapshot.source === 'server') {
    banner.show('Spots updated.');
  }
}

function locate(announce: boolean): void {
  const fallback = () => map.flyTo(OAKLAND, DEFAULT_ZOOM);
  if (!navigator.geolocation) {
    if (announce) banner.show('This browser cannot share your location.');
    return fallback();
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setUser(userPos);
      sheet.setOrigin(origin());
      if (haversineMiles(userPos, OAKLAND) <= NEAR_CAMPUS_MILES) {
        map.flyTo(userPos, DEFAULT_ZOOM);
      } else {
        if (announce) banner.show('You are outside Oakland, so the map is showing campus.');
        fallback();
      }
    },
    () => {
      if (announce) banner.show('Location is off. Allow location access to center the map on you.');
      fallback();
    },
    { enableHighAccuracy: true, timeout: 8000 },
  );
}

const drawer = new Drawer(byId('drawer'), (label) => banner.show(`${label} is coming in a later sprint.`));
const search = new SearchOverlay(byId('search'), {
  getSpots: () => current?.spots.filter((s) => s.status === 'vacant') ?? [],
  origin,
  onGoTo: (pos) => map.flyTo(pos, DEFAULT_ZOOM),
  onSelectSpot: selectSpot,
});

byId('menu-btn').addEventListener('click', () => drawer.open());
byId('search-btn').addEventListener('click', () => search.open());
byId('locate-btn').addEventListener('click', () => locate(true));
refreshBtn.addEventListener('click', () => void refresh(true));
window.addEventListener('online', () => void refresh(false));

void refresh(false);
locate(false);