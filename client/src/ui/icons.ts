// turns svg icon files into text other files can insert into page

import bell from './icons/bell.svg?raw';
import calendar from './icons/calendar.svg?raw';
import car from './icons/car.svg?raw';
import chevronDown from './icons/chevronDown.svg?raw';
import chevronLeft from './icons/chevronLeft.svg?raw';
import chevronRight from './icons/chevronRight.svg?raw';
import close from './icons/close.svg?raw';
import cornerUpRight from './icons/cornerUpRight.svg?raw';
import flag from './icons/flag.svg?raw';
import heart from './icons/heart.svg?raw';
import help from './icons/help.svg?raw';
import info from './icons/info.svg?raw';
import menu from './icons/menu.svg?raw';
import navigation from './icons/navigation.svg?raw';
import pin from './icons/pin.svg?raw';
import refresh from './icons/refresh.svg?raw';
import route from './icons/route.svg?raw';
import search from './icons/search.svg?raw';
import sliders from './icons/sliders.svg?raw';
import squareParking from './icons/squareParking.svg?raw';
import warehouse from './icons/warehouse.svg?raw';

// Left side: the names the app uses. Right side: the Lucide file that draws it.
const ICONS = {
  search,
  menu,
  locate: navigation,
  refresh,
  close,
  car,
  heart,
  calendar,
  flag,
  bell,
  sliders,
  help,
  info,
  chevronRight,
  chevronLeft,
  chevronDown,
  street: route,
  garage: warehouse,
  surface: squareParking,
  pin,
  directions: cornerUpRight,
} as const;

export type IconName = keyof typeof ICONS;

// Returns the SVG text for an icon at a given pixel size
export function icon(name: IconName, size = 22): string {
  // takes the opening <svg ...> tag and returns it with our size and class instead of Lucide's
  function rewriteTag(tag: string): string {
    const withoutOldSizes = tag.replace(/\s(?:width|height|class)="[^"]*"/g, '');
    return withoutOldSizes.replace(
      '<svg',
      `<svg class="icon" width="${size}" height="${size}" aria-hidden="true" focusable="false"`,
    );
  }

  // only the opening tag is rewritten
  return ICONS[name].replace(/<svg[^>]*>/, rewriteTag);
}

// Fills every `<span data-icon="name" data-size="22">` with its SVG
export function hydrateIcons(root: ParentNode = document): void {
  const spans = root.querySelectorAll<HTMLElement>('[data-icon]');
  for (const el of spans) {
    el.innerHTML = icon(el.dataset.icon as IconName, Number(el.dataset.size ?? 22));
  }
}