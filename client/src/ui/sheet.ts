import { formatMiles, haversineMiles } from '../geo';
import type { LatLng, Spot, SpotType, ViewState } from '../types';
import { esc, formatTime } from './dom';
import { icon } from './icons';

export interface SheetHandlers {
  onZoomIn(): void;
  onSelect(spot: Spot): void;
  onCloseDetail(): void;
  onBanner(message: string): void;
}

type SheetState = 'peek' | 'list' | 'detail';

const TYPE_LABEL: Record<SpotType, string> = {
  street: 'Street parking',
  garage: 'Garage',
  surface: 'Surface lot',
};
const MAX_ROWS = 50;

/**
 * Bottom sheet. Three states:
 * peek (count only), list (open spots in view, closest first), detail (one spot).
 */
export class Sheet {
  private state: SheetState = 'peek';
  private view: ViewState = { zoom: 0, streetLevel: false, inView: [] };
  private selected: Spot | null = null;
  private fetchedAt = Date.now();

  constructor(
    private root: HTMLElement,
    private origin: LatLng,
    private handlers: SheetHandlers,
  ) {
    root.addEventListener('click', (e) => this.onClick(e));
    this.render(false);
  }

  setOrigin(origin: LatLng): void {
    this.origin = origin;
  }

  setFetchedAt(ms: number): void {
    this.fetchedAt = ms;
  }

  update(view: ViewState): void {
    this.view = view;
    if (this.state === 'list' && !view.streetLevel) this.state = 'peek';
    if (this.state !== 'detail') this.render(false);
  }

  showDetail(spot: Spot): void {
    this.selected = spot;
    this.state = 'detail';
    this.render(true);
  }

  closeDetail(moveFocus: boolean): void {
    this.selected = null;
    this.state = this.view.streetLevel ? 'list' : 'peek';
    this.render(moveFocus);
  }

  collapse(): void {
    if (this.state === 'list') {
      this.state = 'peek';
      this.render(false);
    }
  }

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-id]');
    if (!target) return;

    if (target.dataset.id !== undefined) {
      const spot = this.view.inView.find((s) => String(s.id) === target.dataset.id);
      if (spot) this.handlers.onSelect(spot);
      return;
    }

    switch (target.dataset.act) {
      case 'toggle':
        if (!this.view.streetLevel) {
          this.handlers.onZoomIn();
        } else {
          this.state = this.state === 'list' ? 'peek' : 'list';
          this.render(true);
        }
        break;
      case 'back':
        this.handlers.onCloseDetail();
        break;
      case 'reserve':
        this.handlers.onBanner('Reservations are coming in a later sprint.');
        break;
      case 'report':
        this.handlers.onBanner('Status reports are coming in a later sprint.');
        break;
    }
  }

  private render(moveFocus: boolean): void {
    const scrollTop = this.root.querySelector('.spots')?.scrollTop ?? 0;
    this.root.dataset.state = this.state;
    this.root.innerHTML =
      this.state === 'detail' && this.selected
        ? this.detailHtml(this.selected)
        : this.headHtml() + (this.state === 'list' ? this.listHtml() : '');

    const spots = this.root.querySelector('.spots');
    if (spots) spots.scrollTop = scrollTop;
    if (moveFocus) this.root.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
  }

  private headHtml(): string {
    const n = this.view.inView.length;
    const street = this.view.streetLevel;
    const expanded = this.state === 'list';
    const hint = street ? (expanded ? 'Hide list' : 'Show list') : 'Zoom in to pick a spot';
    return `
      <button class="sheet__head" data-act="toggle" data-autofocus aria-expanded="${expanded}">
        <span class="sheet__grab" aria-hidden="true"></span>
        <span class="sheet__count" aria-live="polite"><strong>${n}</strong>open spot${n === 1 ? '' : 's'}</span>
        <span class="sheet__hint">${hint}${street ? `<span class="sheet__chev">${icon('chevronDown', 18)}</span>` : ''}</span>
      </button>`;
  }

  private listHtml(): string {
    const rows = this.view.inView
      .map((spot) => ({ spot, miles: haversineMiles(this.origin, spot) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, MAX_ROWS);

    if (rows.length === 0) {
      return '<div class="sheet__body"><p class="sheet__empty">No open spots in this view. Pan the map or zoom out.</p></div>';
    }
    const items = rows
      .map(
        ({ spot, miles }) => `
        <li>
          <button class="spot-row" data-id="${spot.id}">
            <span class="spot-row__icon">${icon(spot.type, 22)}</span>
            <span class="spot-row__main">
              <span class="spot-row__name">${esc(spot.name)}</span>
              <span class="spot-row__sub">${TYPE_LABEL[spot.type]}, ${formatMiles(miles)}</span>
            </span>
            <span class="badge ${spot.isFree ? 'badge--free' : 'badge--paid'}">${spot.isFree ? 'Free' : 'Paid'}</span>
          </button>
        </li>`,
      )
      .join('');
    return `
      <div class="sheet__body">
        <p class="sheet__meta">Closest first. Updated ${formatTime(this.fetchedAt)}.</p>
        <ul class="spots">${items}</ul>
      </div>`;
  }

  private detailHtml(spot: Spot): string {
    const miles = formatMiles(haversineMiles(this.origin, spot));
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    return `
      <div class="detail">
        <div class="detail__top">
          <button class="detail__back" data-act="back" data-autofocus aria-label="Back to spots">${icon('chevronLeft', 22)}</button>
          <div class="detail__title-wrap">
            <h2 class="detail__title">${esc(spot.name)}</h2>
            <p class="detail__sub">${TYPE_LABEL[spot.type]}, ${miles} away</p>
          </div>
          <span class="badge ${spot.isFree ? 'badge--free' : 'badge--paid'}">${spot.isFree ? 'Free' : 'Paid'}</span>
        </div>
        <dl class="facts">
          <div><dt>Status</dt><dd>Open</dd></div>
          <div><dt>Price</dt><dd>${spot.isFree ? 'Free' : 'Paid'}</dd></div>
          <div><dt>Updated</dt><dd>${formatTime(this.fetchedAt)}</dd></div>
        </dl>
        <div class="detail__actions">
          <a class="btn btn--gold" href="${directions}" target="_blank" rel="noopener noreferrer">${icon('directions', 20)}Directions</a>
          <button class="btn" data-act="reserve">Reserve</button>
          <button class="btn btn--quiet" data-act="report">Wrong status?</button>
        </div>
      </div>`;
  }
}