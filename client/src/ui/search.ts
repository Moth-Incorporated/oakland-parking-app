// full screen search when click "where are you headed?"

import {formatMiles, distanceCalc} from '../geo';
import type {LatLng, Spot} from '../types';
import {esc} from './dom';
import {icon} from './icons';

export interface Landmark extends LatLng {
  name: string;
}

// Approximate campus coordinates, good enough for centering the map.
export const LANDMARKS: Landmark[] = [
  { name: 'Cathedral of Learning', latitude: 40.4444, longitude: -79.9532 },
  { name: 'Hillman Library', latitude: 40.4423, longitude: -79.9531 },
  { name: 'William Pitt Union', latitude: 40.4442, longitude: -79.9547 },
  { name: 'Posvar Hall', latitude: 40.4409, longitude: -79.9565 },
  { name: 'Schenley Plaza', latitude: 40.4432, longitude: -79.9488 },
  { name: 'Petersen Events Center', latitude: 40.4447, longitude: -79.9626 },
  { name: 'UPMC Presbyterian', latitude: 40.4423, longitude: -79.9609 },
];

export interface SearchHandlers {
  getSpots(): Spot[];
  origin(): LatLng;
  onGoTo(pos: LatLng): void;
  onSelectSpot(spot: Spot): void;
}

// a spot that matches what was typed, with how far away it is
interface SpotMatch {
  spot: Spot;
  miles: number;
}

// finds the spot whose id matches, or undefined if there is none
function findSpot(spots: Spot[], id: string | undefined): Spot | undefined {
  for (const spot of spots) {
    if (String(spot.id) === id) return spot;
  }
  return undefined;
}

// puts the closer spot first
function byMiles(a: SpotMatch, b: SpotMatch): number {
  return a.miles - b.miles;
}

// the HTML for one landmark in the results (idx is its position in LANDMARKS)
function placeRowHtml(idx: number): string {
  const place = LANDMARKS[idx];
  return `
        <li><button class="result" data-kind="place" data-idx="${idx}">
          <span class="result__icon">${icon('pin', 20)}</span>
          <span class="result__main">${esc(place.name)}</span>
        </button></li>`;
}

// the HTML for one parking spot in the results
function spotRowHtml(match: SpotMatch): string {
  const spot = match.spot;
  return `
        <li><button class="result" data-kind="spot" data-id="${spot.id}">
          <span class="result__icon">${icon(spot.type, 20)}</span>
          <span class="result__main">${esc(spot.name)}<span class="result__sub">${formatMiles(match.miles)} away</span></span>
          <span class="badge ${spot.isFree ? 'badge--free-light' : 'badge--paid-light'}">${spot.isFree ? 'Free' : 'Paid'}</span>
        </button></li>`;
}

export class SearchOverlay {
  private root: HTMLElement;
  private handlers: SearchHandlers;
  private input: HTMLInputElement;
  private results: HTMLElement;
  private opener: HTMLElement | null = null;

  constructor(root: HTMLElement, handlers: SearchHandlers) {
    this.root = root;
    this.handlers = handlers;
    root.inert = true;
    root.innerHTML = `
      <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search Oakland">
        <div class="search__bar">
          <span class="search__icon">${icon('search', 22)}</span>
          <input class="search__input" type="search" placeholder="Search a building or street"
                 autocomplete="off" enterkeyhint="search" aria-label="Search a building or street" />
          <button class="search__close" data-act="close" aria-label="Close search">${icon('close', 22)}</button>
        </div>
        <div class="search__results"></div>
      </div>`;
    this.input = root.querySelector<HTMLInputElement>('.search__input')!;
    this.results = root.querySelector<HTMLElement>('.search__results')!;

    this.input.addEventListener('input', this.renderResults.bind(this));
    root.addEventListener('keydown', this.onKeyDown.bind(this));
    root.addEventListener('click', this.onClick.bind(this));
  }

  open(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.root.inert = false;
    this.root.dataset.open = 'true';
    this.input.value = '';
    this.renderResults();
    this.input.focus();
  }

  close(): void {
    delete this.root.dataset.open;
    this.root.inert = true;
    this.opener?.focus();
  }

  // runs for every key pressed inside the search
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
  }

  // runs for every click inside the search
  private onClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('[data-act="close"]')) {
      this.close();
      return;
    }
    const row = target.closest<HTMLElement>('[data-kind]');
    if (!row) return;
    if (row.dataset.kind === 'place') {
      const place = LANDMARKS[Number(row.dataset.idx)];
      this.close();
      this.handlers.onGoTo(place);
    } else {
      const spot = findSpot(this.handlers.getSpots(), row.dataset.id);
      this.close();
      if (spot) this.handlers.onSelectSpot(spot);
    }
  }

  private renderResults(): void {
    const q = this.input.value.trim().toLowerCase();
    const origin = this.handlers.origin();

    // the landmarks whose names contain what was typed, kept as positions in the LANDMARKS list
    const placeIndexes: number[] = [];
    for (let idx = 0; idx < LANDMARKS.length; idx++) {
      if (LANDMARKS[idx].name.toLowerCase().includes(q)) placeIndexes.push(idx);
    }

    // the open spots whose names contain what was typed, each with its distance, closest first
    const matches: SpotMatch[] = [];
    for (const spot of this.handlers.getSpots()) {
      if (spot.name.toLowerCase().includes(q)) matches.push({ spot, miles: distanceCalc(origin, spot) });
    }
    matches.sort(byMiles);
    const spots = matches.slice(0, 5); // only the 5 closest

    if (placeIndexes.length === 0 && spots.length === 0) {
      this.results.innerHTML = `<p class="search__empty">Nothing matches “${esc(this.input.value.trim())}”. Try a building or street name.</p>`;
      return;
    }

    const placeRows = placeIndexes.map(placeRowHtml).join('');
    const spotRows = spots.map(spotRowHtml).join('');

    this.results.innerHTML =
      (placeIndexes.length ? `<h3 class="search__heading">Campus</h3><ul class="search__list">${placeRows}</ul>` : '') +
      (spots.length
        ? `<h3 class="search__heading">${q ? 'Open spots' : 'Closest open spots'}</h3><ul class="search__list">${spotRows}</ul>`
        : '');
  }
}