// The shared icons (specs/icons.md). The expected markup is what the four private icon files drew before the extraction
// (Message, Select, Input and Menu), captured from them: every name drew the same markup in every file that had it.
import { cleanup, render } from '@testing-library/svelte';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import InputIcon from '../src/lib/Input/InputIcon.svelte';
import Icon, { ICON_NAMES, type IconName } from '../src/lib/internal/icons/Icon.svelte';
import MenuIcon from '../src/lib/Menu/MenuIcon.svelte';
import MessageIcon from '../src/lib/Message/MessageIcon.svelte';
import SelectIcon from '../src/lib/Select/SelectIcon.svelte';

afterEach(cleanup);

/** The expected children of the svg, per name, with the id of a mask written as `CUT`. */
const EXPECTED: Record<IconName, string> = {
  'arrow': '<path d="M3.2 6l4.8 4.8L12.8 6"></path>',
  'check': '<path d="M3 8.6l3.2 3.2L13 5"></path>',
  'clear': '<mask maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" id="CUT"><rect width="16" height="16" fill="#fff" stroke="none"></rect><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#000" stroke-width="1.6"></path></mask><circle cx="8" cy="8" r="7" fill="currentColor" mask="CUT"></circle>',
  'close': '<path d="M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4"></path>',
  'ellipsis': '<circle cx="3" cy="8" r="1.3"></circle><circle cx="8" cy="8" r="1.3"></circle><circle cx="13" cy="8" r="1.3"></circle>',
  'error': '<mask maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" id="CUT"><rect width="16" height="16" fill="#fff" stroke="none"></rect><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#000" stroke-width="1.6"></path></mask><circle cx="8" cy="8" r="7" fill="currentColor" stroke="none" mask="CUT"></circle>',
  'eye': '<path d="M1 8s2.6-4.8 7-4.8S15 8 15 8s-2.6 4.8-7 4.8S1 8 1 8z"></path><circle cx="8" cy="8" r="2.1"></circle>',
  'eye-off': '<path d="M1 8s2.6-4.8 7-4.8S15 8 15 8s-2.6 4.8-7 4.8S1 8 1 8z"></path><circle cx="8" cy="8" r="2.1"></circle><path d="M2.6 13.4L13.4 2.6"></path>',
  'info': '<mask maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" id="CUT"><rect width="16" height="16" fill="#fff" stroke="none"></rect><circle cx="8" cy="4.9" r="1" fill="#000" stroke="none"></circle><path d="M8 7.4v4" stroke="#000" stroke-width="1.6"></path></mask><circle cx="8" cy="8" r="7" fill="currentColor" stroke="none" mask="CUT"></circle>',
  'loading': '<circle class="track" cx="8" cy="8" r="6"></circle><path class="arc" d="M8 2a6 6 0 0 1 6 6"></path>',
  'remove': '<path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2"></path>',
  'search': '<circle cx="7" cy="7" r="4.6"></circle><path d="M10.4 10.4L14 14"></path>',
  'success': '<mask maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" id="CUT"><rect width="16" height="16" fill="#fff" stroke="none"></rect><path d="M4.8 8.2l2.3 2.3 4.2-4.6" stroke="#000" stroke-width="1.6"></path></mask><circle cx="8" cy="8" r="7" fill="currentColor" stroke="none" mask="CUT"></circle>',
  'warning': '<mask maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16" id="CUT"><rect width="16" height="16" fill="#fff" stroke="none"></rect><path d="M8 4.4v4.2" stroke="#000" stroke-width="1.6"></path><circle cx="8" cy="11.2" r="1" fill="#000" stroke="none"></circle></mask><circle cx="8" cy="8" r="7" fill="currentColor" stroke="none" mask="CUT"></circle>',
};

/** The markup without what is not the icon: the hash of the scoped styles, the id of a mask, the comments of the blocks. */
const inner = (svg: Element): string =>
  svg.innerHTML
    .replace(/<!---->/g, '')
    .replace(/svelte-[a-z0-9]+/g, '')
    .replace(/class="\s*/g, 'class="')
    .replace(/\s+"/g, '"')
    .replace(/ class=""/g, '')
    .replace(/(id|mask)="(?:url\(#)?[^"]*-cut\)?"/g, (_, attribute) => `${attribute}="CUT"`)
    .replace(/\s+/g, ' ')
    .trim();

const svgOf = (container: HTMLElement): SVGSVGElement => container.querySelector('svg') as SVGSVGElement;

describe('Icon: the same drawing as before (I1, I2)', () => {
  it('the set is the fourteen names, and every name has a drawing', () => {
    expect([...ICON_NAMES].sort()).toEqual(Object.keys(EXPECTED).sort());
    expect(ICON_NAMES).toHaveLength(14);
  });

  it.each(ICON_NAMES)('%s: draws what the old file drew', (name) => {
    const { container } = render(Icon, { name });
    expect(inner(svgOf(container))).toBe(EXPECTED[name]);
  });

  it.each(ICON_NAMES)('%s: a 16 by 16 grid, the size of the text, hidden from assistive technology', (name) => {
    const { container } = render(Icon, { name });
    const svg = svgOf(container);
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('height')).toBe('1em');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.hasAttribute('role')).toBe(false);
    expect(svg.querySelector('title')).toBeNull();
    expect(svg.classList.contains('ads-icon')).toBe(true);
    expect(svg.classList.contains(`ads-icon-${name}`)).toBe(true);
  });

  it('the classes the owner passes are added to its own', () => {
    const { container } = render(Icon, { name: 'arrow', class: 'mine and-more' });
    expect(svgOf(container)).toHaveClass('ads-icon', 'ads-icon-arrow', 'mine', 'and-more');
  });
});

describe('Icon: the id of a mask (I3)', () => {
  it.each(['clear', 'info', 'success', 'error', 'warning'] as const)('%s: two icons never share the mask', (name) => {
    const first = render(Icon, { name });
    const second = render(Icon, { name });
    const ids = [first.container, second.container].map((container) => svgOf(container).querySelector('mask')?.id);
    expect(ids[0]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
    for (const container of [first.container, second.container]) {
      const id = svgOf(container).querySelector('mask')?.id;
      expect(svgOf(container).querySelector('circle[mask]')?.getAttribute('mask')).toBe(`url(#${id})`);
    }
  });

  it('an icon with no sign cut out has no mask', () => {
    const { container } = render(Icon, { name: 'arrow' });
    expect(svgOf(container).querySelector('mask')).toBeNull();
  });
});

describe('the adapters of the four components keep their class names (I7)', () => {
  const cases: [string, typeof MessageIcon | typeof SelectIcon | typeof InputIcon | typeof MenuIcon, string[], (name: string) => string[]][] = [
    ['MessageIcon', MessageIcon, ['info', 'success', 'error', 'warning', 'loading', 'close'], (name) => ['ads-message-svg', `ads-message-svg-${name}`]],
    ['SelectIcon', SelectIcon, ['arrow', 'search', 'clear', 'check', 'remove', 'loading'], (name) => ['ads-select-icon', `ads-select-icon-${name}`]],
    ['InputIcon', InputIcon, ['clear', 'eye', 'eye-off', 'search', 'loading'], (name) => ['ads-input-icon', `ads-input-icon-${name}`]],
    ['MenuIcon', MenuIcon, ['arrow', 'ellipsis'], (name) => (name === 'ellipsis' ? ['ads-menu-icon', 'ads-menu-icon-ellipsis'] : ['ads-menu-icon'])]
  ];
  for (const [owner, Adapter, names, classes] of cases) {
    it.each(names)(`${owner} %s: its own classes and the shared drawing`, (name) => {
      const { container } = render(Adapter as typeof InputIcon, { name: name as 'clear' });
      const svg = svgOf(container);
      expect(svg).toHaveClass(...classes(name), 'ads-icon', `ads-icon-${name}`);
      expect(inner(svg)).toBe(EXPECTED[name as IconName]);
    });
  }
  it('MenuIcon: the arrow has no ellipsis class', () => {
    const { container } = render(MenuIcon, { name: 'arrow' });
    expect(svgOf(container)).not.toHaveClass('ads-menu-icon-ellipsis');
  });
});

describe('Icon on the server (I8)', () => {
  it('renders the same svg and touches no document', () => {
    const root = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'src/lib/internal/icons/Icon.svelte', props: { name: 'search' } }])],
      { cwd: root, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('ads-icon-search');
    expect(html).toContain('<circle');
  });
});
