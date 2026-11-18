// Helpers shared by the Menu tests.
import { fireEvent, screen } from '@testing-library/svelte';
import type { MenuItems } from '../src/lib/Menu/types';

/** A small tree: items, a disabled one, a submenu with a nested one. */
export const items: MenuItems = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta' },
  { key: 'c', label: 'Gamma', disabled: true },
  {
    key: 'sub',
    label: 'Sub',
    children: [
      { key: 's1', label: 'Sub one' },
      { key: 's2', label: 'Sub two' },
      { key: 'deep', label: 'Deep', children: [{ key: 'd1', label: 'Deep one' }] }
    ]
  },
  { key: 'z', label: 'Zed' }
];

/** The element of an item or submenu title by its key. */
export const byKey = (key: string): HTMLElement => {
  const found = document.querySelector<HTMLElement>(`[data-ads-key="${key}"]`);
  if (!found) throw new Error(`no item with the key ${key}`);
  return found;
};

export const rootList = () => document.querySelector<HTMLElement>('ul.ads-menu-root')!;
export const popupLists = () => Array.from(document.querySelectorAll<HTMLElement>('ul.ads-menu-popup-list'));
export const popupPanels = () => Array.from(document.querySelectorAll<HTMLElement>('.ads-popup:not([hidden])'));

/** What `screen.getByTestId('x')` shows in the harness. */
export const selected = () => screen.getByTestId('selected').textContent;
export const open = () => screen.getByTestId('open').textContent;

export const keydown = (target: Element, key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key, ...init });

/** A finger went down on the element (the compatibility mouse events of a tap follow). */
export function touchDown(target: Element): void {
  const event = new Event('pointerdown', { bubbles: true });
  Object.defineProperty(event, 'pointerType', { value: 'touch' });
  target.dispatchEvent(event);
}

/** A mouse press anywhere (the registry of popups listens on the document). */
export const pointerDown = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }));

/** The pointer entered the element (`mouseenter` does not bubble). */
export const hoverIn = (target: Element) => fireEvent.mouseEnter(target);
export const hoverOut = (target: Element) => fireEvent.mouseLeave(target);
