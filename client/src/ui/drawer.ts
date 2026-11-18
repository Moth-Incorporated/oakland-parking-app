import { icon, type IconName } from './icons';

interface Entry {
  label: string;
  icon: IconName;
}

const TILES: Entry[] = [
  { label: 'Favorites', icon: 'heart' },
  { label: 'Vehicle', icon: 'car' },
  { label: 'Reservations', icon: 'calendar' },
  { label: 'Report a problem', icon: 'flag' },
];
const LINKS: Entry[] = [
  { label: 'Filters', icon: 'sliders' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Help', icon: 'help' },
  { label: 'About Moth Inc.', icon: 'info' },
];

/** Right-hand menu. Every entry is a placeholder until its feature ships. */
export class Drawer {
  private opener: HTMLElement | null = null;

  constructor(
    private root: HTMLElement,
    private onEntry: (label: string) => void,
  ) {
    root.inert = true;
    root.innerHTML = `
      <div class="drawer__scrim" data-act="close"></div>
      <nav class="drawer__panel" aria-label="Menu">
        <div class="drawer__head">
          <div>
            <p class="drawer__brand">Oakland Parking</p>
            <p class="drawer__by">by Moth Inc.</p>
          </div>
          <button class="drawer__close" data-act="close" aria-label="Close menu">${icon('close', 22)}</button>
        </div>
        <div class="tiles">
          ${TILES.map((t) => `<button class="tile" data-entry="${t.label}">${icon(t.icon, 26)}${t.label}</button>`).join('')}
        </div>
        <ul class="menu">
          ${LINKS.map(
            (l) => `<li><button class="menu__item" data-entry="${l.label}">${icon(l.icon, 22)}${l.label}<span class="menu__chev">${icon('chevronRight', 18)}</span></button></li>`,
          ).join('')}
        </ul>
      </nav>`;

    root.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-act="close"]')) return this.close();
      const entry = target.closest<HTMLElement>('[data-entry]');
      if (entry?.dataset.entry) {
        this.close();
        this.onEntry(entry.dataset.entry);
      }
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.root.inert = false;
    this.root.dataset.open = 'true';
    this.root.querySelector<HTMLElement>('.drawer__close')?.focus();
  }

  close(): void {
    delete this.root.dataset.open;
    this.root.inert = true;
    this.opener?.focus();
  }
}