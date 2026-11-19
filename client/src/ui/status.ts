// thing under search bar that tells user what kind of data they are looking at
import type {DataSource} from '../types';
import {esc, formatTime} from './dom';

// Small chip under the search bar. Hidden when everything is live and idle
export class StatusChip {
  private el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  update(source: DataSource, fetchedAt: number, loading: boolean): void {
    let text = '';
    if (loading) text = 'Refreshing…';
    else if (source === 'cache') text = `Offline. Showing spots from ${formatTime(fetchedAt)}`;
    else if (source === 'demo') text = 'Demo data';

    this.el.hidden = text === '';
    this.el.dataset.kind = loading ? 'loading' : source;
    this.el.innerHTML = (loading ? '<span class="spinner" aria-hidden="true"></span>' : '') + esc(text);
  }
}