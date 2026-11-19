// main shit fr
// create each piece of app and connect it

import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/app.css';

import {DEFAULT_RADIUS_MILES, getSnapshot} from './api';
import {distanceCalc} from './geo';
import {startAutoRefresh} from './quality-system/refresh';
import type {LatLng, Snapshot, Spot, ViewState} from './types';
import {Banner} from './ui/banner';
import {Drawer} from './ui/drawer';
import {byId} from './ui/dom';
import {hydrateIcons} from './ui/icons';
import {ParkingMap} from './ui/map';
import {SearchOverlay} from './ui/search';
import {Sheet} from './ui/sheet';
import {StatusChip} from './ui/status';

// Cathedral of Learning. app is for Oakland, so this is fallback center.
const OAKLAND: LatLng = {latitude: 40.4444, longitude: -79.9532};
const NEAR_CAMPUS_MILES = 3; // have to be within 3 miles of campus
const DEFAULT_ZOOM = 16; // starting zoom level

hydrateIcons();

const banner = new Banner(byId('banner'));
const status = new StatusChip(byId('status-chip'));
const refreshBtn = byId<HTMLButtonElement>('refresh-btn');

let userPos: LatLng | null = null;
let current: Snapshot | null = null;
let selected: Spot | null = null;
let loading = false;

// The point distances are measured from. If on campus, youre origin, if not its campus
function origin(): LatLng {
  if (userPos && distanceCalc(userPos, OAKLAND) <= NEAR_CAMPUS_MILES) return userPos;
  return OAKLAND;
}

// functions the sheet calls when something happens
function zoomToStreets(): void {
  map.zoomToStreets();
}

function closeDetail(): void {
  clearSelection(true);
}

function showBanner(message: string): void {
  banner.show(message);
}

const sheet = new Sheet(byId('sheet'), OAKLAND, {
  onZoomIn: zoomToStreets,
  onSelect: selectSpot,
  onCloseDetail: closeDetail,
  onBanner: showBanner,
});

// lets banner and leaflet's controls sit above the sheet
const sheetEl = byId('sheet');

function updateSheetHeight(): void {
  document.documentElement.style.setProperty('--sheet-h', `${sheetEl.offsetHeight}px`);
}

new ResizeObserver(updateSheetHeight).observe(sheetEl);

// functions the map calls when something happens
function updateSheet(view: ViewState): void {
  sheet.update(view);
}

function handleBackgroundTap(): void {
  if (selected) clearSelection(false);
  else sheet.collapse();
}

const map = new ParkingMap(byId('map'), OAKLAND, {
  onSelect: selectSpot,
  onViewChange: updateSheet,
  onBackgroundTap: handleBackgroundTap,
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

// runs every 5 minutes
function autoRefresh(): void {
  void refresh(false);
}

const auto = startAutoRefresh(autoRefresh);

// true if this spot is the one the user selected and it is still open
function isSelectedSpotOpen(spot: Spot): boolean {
  return selected !== null && spot.id === selected.id && spot.status === 'vacant';
}

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

  if (selected && !snapshot.spots.some(isSelectedSpotOpen)) {
    banner.show('That spot was just taken.');
    clearSelection(false);
  } else if (manual && snapshot.source === 'server') {
    banner.show('Spots updated.');
  }
}

// moves the map to campus
function flyToCampus(): void {
  map.flyTo(OAKLAND, DEFAULT_ZOOM);
}

function locate(announce: boolean): void {
  // runs when the browser gives us the user's position
  function onFound(pos: GeolocationPosition): void {
    userPos = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    map.setUser(userPos);
    sheet.setOrigin(origin());
    if (distanceCalc(userPos, OAKLAND) <= NEAR_CAMPUS_MILES) {
      map.flyTo(userPos, DEFAULT_ZOOM);
    } else {
      if (announce) banner.show('You are outside Oakland, so the map is showing campus.');
      flyToCampus();
    }
  }

  // runs when the browser cannot or will not give us the position
  function onDenied(): void {
    if (announce) banner.show('Location is off. Allow location access to center the map on you.');
    flyToCampus();
  }

  if (!navigator.geolocation) {
    if (announce) banner.show('This browser cannot share your location.');
    flyToCampus();
    return;
  }
  navigator.geolocation.getCurrentPosition(onFound, onDenied, { enableHighAccuracy: true, timeout: 8000 });
}

// shows a message for menu entries that are not built yet
function showComingSoon(label: string): void {
  banner.show(`${label} is coming in a later sprint.`);
}

const drawer = new Drawer(byId('drawer'), showComingSoon);

function isVacant(spot: Spot): boolean {
  return spot.status === 'vacant';
}

function getVacantSpots(): Spot[] {
  if (current === null) return [];
  return current.spots.filter(isVacant);
}

function goTo(pos: LatLng): void {
  map.flyTo(pos, DEFAULT_ZOOM);
}

const search = new SearchOverlay(byId('search'), {
  getSpots: getVacantSpots,
  origin,
  onGoTo: goTo,
  onSelectSpot: selectSpot,
});

function openMenu(): void {
  drawer.open();
}

function openSearch(): void {
  search.open();
}

function onLocateClick(): void {
  locate(true);
}

function onRefreshClick(): void {
  void refresh(true);
}

function onOnline(): void {
  void refresh(false);
}

byId('menu-btn').addEventListener('click', openMenu);
byId('search-btn').addEventListener('click', openSearch);
byId('locate-btn').addEventListener('click', onLocateClick);
refreshBtn.addEventListener('click', onRefreshClick);
window.addEventListener('online', onOnline);

void refresh(false);
locate(false);