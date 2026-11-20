// the menu that slides in from right when click 3 horizontal lines icon

import {icon, type IconName} from './icons';

interface Entry {
  label: string;
  icon: IconName;
}

// Something that can be called with a menu entry's name and gives nothing back.
interface EntryCallback {
  (label: string): void;
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

// the html for one of the big square buttons at the top of the menu
function tileHtml(t: Entry): string {
  return `<button class="tile" data-entry="${t.label}">${icon(t.icon, 26)}${t.label}</button>`;
}

// the HTML for one row in the list under the tiles
function linkHtml(l: Entry): string {
  return `<li><button class="menu__item" data-entry="${l.label}">${icon(l.icon, 22)}${l.label}<span class="menu__chev">${icon('chevronRight', 18)}</span></button></li>`;
}

// the HTML for the whole menu
function drawerHtml(): string {
  return `
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
        ${TILES.map(tileHtml).join('')}
      </div>
      <ul class="menu">
        ${LINKS.map(linkHtml).join('')}
      </ul>
    </nav>`;
}

/// Right hand menu, every entry is placeholder until its feature ships.
export class Drawer {
  private root: HTMLElement;
  private onEntry: EntryCallback;
  private opener: HTMLElement | null = null;

  constructor(root: HTMLElement, onEntry: EntryCallback) {
    this.root = root;
    this.onEntry = onEntry;
    root.inert = true;
    root.innerHTML = drawerHtml();
    root.addEventListener('click', this.onClick.bind(this));
    root.addEventListener('keydown', this.onKeyDown.bind(this));
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

  // runs for every click inside the menu
  private onClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('[data-act="close"]')) {
      this.close();
      return;
    }
    const entry = target.closest<HTMLElement>('[data-entry]');
    if (entry?.dataset.entry) {
      this.close();
      this.onEntry(entry.dataset.entry);
    }
  }

  // runs for every key pressed inside the menu
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
  }
}