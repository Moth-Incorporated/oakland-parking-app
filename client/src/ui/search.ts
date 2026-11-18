import { formatMiles, haversineMiles } from '../geo';
import type { LatLng, Spot } from '../types';
import { esc } from './dom';
import { icon } from './icons';

export interface Landmark extends LatLng {
  name: string;
}

// Approximate campus coordinates, good enough for centering the map.
export const LANDMARKS: Landmark[] = [
  { name: 'Cathedral of Learning', lat: 40.4444, lng: -79.9532 },
  { name: 'Hillman Library', lat: 40.4423, lng: -79.9531 },
  { name: 'William Pitt Union', lat: 40.4442, lng: -79.9547 },
  { name: 'Posvar Hall', lat: 40.4409, lng: -79.9565 },
  { name: 'Schenley Plaza', lat: 40.4432, lng: -79.9488 },
  { name: 'Petersen Events Center', lat: 40.4447, lng: -79.9626 },
  { name: 'UPMC Presbyterian', lat: 40.4423, lng: -79.9609 },
];

export interface SearchHandlers {
  getSpots(): Spot[];
  origin(): LatLng;
  onGoTo(pos: LatLng): void;
  onSelectSpot(spot: Spot): void;
}

export class SearchOverlay {
  private input: HTMLInputElement;
  private results: HTMLElement;
  private opener: HTMLElement | null = null;

  constructor(
    private root: HTMLElement,
    private handlers: SearchHandlers,
  ) {
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

    this.input.addEventListener('input', () => this.renderResults());
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    root.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-act="close"]')) return this.close();
      const row = target.closest<HTMLElement>('[data-kind]');
      if (!row) return;
      if (row.dataset.kind === 'place') {
        const place = LANDMARKS[Number(row.dataset.idx)];
        this.close();
        this.handlers.onGoTo(place);
      } else {
        const spot = this.handlers.getSpots().find((s) => String(s.id) === row.dataset.id);
        this.close();
        if (spot) this.handlers.onSelectSpot(spot);
      }
    });
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

  private renderResults(): void {
    const q = this.input.value.trim().toLowerCase();
    const origin = this.handlers.origin();

    const places = LANDMARKS.map((place, idx) => ({ place, idx })).filter(({ place }) =>
      place.name.toLowerCase().includes(q),
    );
    const spots = this.handlers
      .getSpots()
      .filter((s) => s.name.toLowerCase().includes(q))
      .map((spot) => ({ spot, miles: haversineMiles(origin, spot) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 5);

    if (places.length === 0 && spots.length === 0) {
      this.results.innerHTML = `<p class="search__empty">Nothing matches “${esc(this.input.value.trim())}”. Try a building or street name.</p>`;
      return;
    }

    const placeRows = places
      .map(
        ({ place, idx }) => `
        <li><button class="result" data-kind="place" data-idx="${idx}">
          <span class="result__icon">${icon('pin', 20)}</span>
          <span class="result__main">${esc(place.name)}</span>
        </button></li>`,
      )
      .join('');
    const spotRows = spots
      .map(
        ({ spot, miles }) => `
        <li><button class="result" data-kind="spot" data-id="${spot.id}">
          <span class="result__icon">${icon(spot.type, 20)}</span>
          <span class="result__main">${esc(spot.name)}<span class="result__sub">${formatMiles(miles)} away</span></span>
          <span class="badge ${spot.isFree ? 'badge--free-light' : 'badge--paid-light'}">${spot.isFree ? 'Free' : 'Paid'}</span>
        </button></li>`,
      )
      .join('');

    this.results.innerHTML =
      (places.length ? `<h3 class="search__heading">Campus</h3><ul class="search__list">${placeRows}</ul>` : '') +
      (spots.length
        ? `<h3 class="search__heading">${q ? 'Open spots' : 'Closest open spots'}</h3><ul class="search__list">${spotRows}</ul>`
        : '');
  }
}