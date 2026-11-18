// The tree of the Menu and the keyboard helpers (specs/menu.md): no Svelte, no layout.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Registration } from '../src/lib/Menu/context';
import { itemText, matchTypeahead, navigableItems } from '../src/lib/Menu/nav';
import {
  buildIndex,
  focusableKeys,
  keyPathOf,
  labelText,
  nodesFromRegistrations,
  normalizeItems,
  selectedAncestors,
  type MenuNode
} from '../src/lib/Menu/tree';
import type { MenuItems } from '../src/lib/Menu/types';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const sample: MenuItems = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta', disabled: true },
  {
    key: 's',
    label: 'Sub',
    children: [
      { key: 's1', label: 'Sub one' },
      { key: 's2', label: 'Sub two', disabled: true },
      { key: 'ss', label: 'Deep', children: [{ key: 'ss1', label: 'Deep one' }] }
    ]
  },
  { type: 'divider', dashed: true },
  { type: 'group', label: 'Group', children: [{ key: 'g1', label: 'Group one' }, { type: 'divider' }] },
  { key: 'z', label: 'Zed' }
];

describe('normalizeItems', () => {
  it('turns items, submenus, groups and dividers into nodes', () => {
    const nodes = normalizeItems(sample);
    expect(nodes.map((node) => node.kind)).toEqual(['item', 'item', 'submenu', 'divider', 'group', 'item']);
    const sub = nodes[2];
    expect(sub.kind === 'submenu' && sub.children.map((child) => child.key)).toEqual(['s1', 's2', 'ss']);
    const divider = nodes[3];
    expect(divider.kind === 'divider' && divider.dashed).toBe(true);
    const group = nodes[4];
    expect(group.kind === 'group' && group.label).toBe('Group');
    expect(group.kind === 'group' && group.children.map((child) => child.kind)).toEqual(['item', 'divider']);
  });

  it('keeps the object of an item as its data (itemData is the object the consumer wrote)', () => {
    const item = { key: 'a', label: 'Alpha' };
    const nodes = normalizeItems([item]);
    expect(nodes[0].kind === 'item' && nodes[0].data).toBe(item);
  });

  it('gives a divider that is not dashed dashed: false, and gives every group and divider a key of its own', () => {
    const nodes = normalizeItems([{ type: 'divider' }, { type: 'divider' }, { type: 'group', children: [] }]);
    expect(nodes[0].kind === 'divider' && nodes[0].dashed).toBe(false);
    expect(new Set(nodes.map((node) => node.key)).size).toBe(3);
  });

  it('skips entries that are null, and entries without a usable key (with a warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nodes = normalizeItems([null, undefined, { key: '', label: 'Empty' }, { key: 7 as unknown as string, label: 'Number' }, { key: 'ok' }] as unknown as MenuItems);
    expect(nodes.map((node) => node.key)).toEqual(['ok']);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toContain('non-empty string');
  });

  it('keeps the first of two items with one key, also across levels (with a warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nodes = normalizeItems([
      { key: 'a', label: 'First' },
      { key: 's', label: 'Sub', children: [{ key: 'a', label: 'Second' }] }
    ]);
    const sub = nodes[1];
    expect(sub.kind === 'submenu' && sub.children).toEqual([]);
    expect(nodes[0].kind === 'item' && nodes[0].data.label).toBe('First');
    expect(warn.mock.calls[0][0]).toContain('"a" is used twice');
  });

  it('skips a submenu that has no usable key, or a key that is already used (with a warning), and what is inside it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nodes = normalizeItems([
      { key: 'a', label: 'A' },
      { key: 'a', label: 'Again', children: [{ key: 'inner', label: 'Inner' }] },
      { key: '', label: 'Nameless', children: [{ key: 'inner2', label: 'Inner' }] }
    ]);
    expect(nodes.map((node) => node.key)).toEqual(['a']);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('does not warn in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    normalizeItems([{ key: 'a' }, { key: 'a' }]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('an empty list is an empty tree', () => {
    expect(normalizeItems([])).toEqual([]);
  });
});

describe('buildIndex, keyPathOf, selectedAncestors', () => {
  const nodes = normalizeItems(sample);
  const index = buildIndex(nodes);

  it('knows every item and submenu by key, and the submenu each is in (a group is not a level)', () => {
    expect([...index.nodeOf.keys()]).toEqual(['a', 'b', 's', 's1', 's2', 'ss', 'ss1', 'g1', 'z']);
    expect(index.parentOf.get('a')).toBeNull();
    expect(index.parentOf.get('ss1')).toBe('ss');
    expect(index.parentOf.get('ss')).toBe('s');
    expect(index.parentOf.get('g1')).toBeNull();
  });

  it('knows the position of the top-level node that holds a key (a group counts as one)', () => {
    expect(index.topIndexOf.get('a')).toBe(0);
    expect(index.topIndexOf.get('ss1')).toBe(2);
    expect(index.topIndexOf.get('g1')).toBe(4);
    expect(index.topIndexOf.get('z')).toBe(5);
  });

  it('keyPathOf goes from the item up to the outermost submenu', () => {
    expect(keyPathOf(index, 'ss1')).toEqual(['ss1', 'ss', 's']);
    expect(keyPathOf(index, 'a')).toEqual(['a']);
    expect(keyPathOf(index, 'unknown')).toEqual(['unknown']);
  });

  it('selectedAncestors are the submenus that hold a selected key; unknown keys are ignored', () => {
    expect([...selectedAncestors(index, new Set(['ss1', 'nothing']))].sort()).toEqual(['s', 'ss']);
    expect([...selectedAncestors(index, new Set(['a']))]).toEqual([]);
  });
});

describe('focusableKeys', () => {
  const nodes = normalizeItems(sample);

  it('lists items and submenus that are not disabled, entering a submenu only when it is expanded', () => {
    expect(focusableKeys(nodes, () => false, null)).toEqual(['a', 's', 'g1', 'z']);
    expect(focusableKeys(nodes, (key) => key === 's', null)).toEqual(['a', 's', 's1', 'ss', 'g1', 'z']);
    expect(focusableKeys(nodes, () => true, null)).toEqual(['a', 's', 's1', 'ss', 'ss1', 'g1', 'z']);
  });

  it('a bar shows only its first nodes; the others are left out', () => {
    expect(focusableKeys(nodes, () => false, 3)).toEqual(['a', 's']);
    expect(focusableKeys(nodes, () => false, 0)).toEqual([]);
  });

  it('does not enter a disabled submenu', () => {
    const disabled = normalizeItems([{ key: 'd', label: 'D', disabled: true, children: [{ key: 'd1' }] }]);
    expect(focusableKeys(disabled, () => true, null)).toEqual([]);
  });
});

describe('labelText', () => {
  it('is the text of a string or number label, and nothing for anything else', () => {
    expect(labelText('Text')).toBe('Text');
    expect(labelText(0)).toBe('0');
    expect(labelText(undefined)).toBeUndefined();
    expect(labelText((() => {}) as never)).toBeUndefined();
  });
});

describe('nodesFromRegistrations', () => {
  /** A registration with a marker in the document, in the order given by `at` (the position in `host`). */
  function marker(host: HTMLElement): HTMLElement {
    const element = document.createElement('span');
    host.append(element);
    return element;
  }

  it('builds the tree in the order of the markers, whatever the order of the registrations', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const first = marker(host);
    const sub = marker(host);
    const child = marker(host);
    const last = marker(host);
    const group = marker(host);
    const inGroup = marker(host);
    const divider = marker(host);
    const subReg: Registration = {
      kind: 'submenu',
      node: () => sub,
      parent: undefined,
      props: () => ({ key: 's', label: 'Sub', icon: undefined, disabled: undefined, popupClassName: undefined, popupOffset: undefined, theme: undefined, ontitleclick: undefined, popupRender: undefined, class: undefined })
    };
    const groupReg: Registration = { kind: 'group', node: () => group, parent: undefined, props: () => ({ label: 'G', class: 'gc' }) };
    const item = (key: string, element: HTMLElement, parent?: Registration, label?: string, children?: never): Registration => ({
      kind: 'item',
      node: () => element,
      parent: parent as never,
      props: () => ({ key, label, icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children })
    });
    const registrations: Registration[] = [
      item('last', last, undefined, 'Last'),
      item('child', child, subReg, 'Child'),
      { kind: 'divider', node: () => divider, parent: undefined, props: () => ({ dashed: true }) },
      item('in-group', inGroup, groupReg, 'In group'),
      groupReg,
      item('first', first, undefined, 'First'),
      subReg
    ];
    const nodes = nodesFromRegistrations(registrations);
    expect(nodes.map((node) => node.key.replace(/:\d+$/, ''))).toEqual(['first', 's', 'last', 'group', 'divider']);
    const sub1 = nodes[1];
    expect(sub1.kind === 'submenu' && sub1.children.map((node) => node.key)).toEqual(['child']);
    const group1 = nodes[3];
    expect(group1.kind === 'group' && group1.children.map((node) => node.key)).toEqual(['in-group']);
    expect(group1.kind === 'group' && group1.class).toBe('gc');
    const divider1 = nodes[4];
    expect(divider1.kind === 'divider' && divider1.dashed).toBe(true);
  });

  it('an item takes its content (the children snippet) as its label when it has no label', () => {
    const snippet = (() => {}) as never;
    const nodes = nodesFromRegistrations([
      {
        kind: 'item',
        node: () => null,
        parent: undefined,
        props: () => ({ key: 'a', label: undefined, icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children: snippet })
      }
    ]);
    expect(nodes[0].kind === 'item' && nodes[0].data.label).toBe(snippet);
  });

  it('the label prop wins over the content of an item', () => {
    const snippet = (() => {}) as never;
    const nodes = nodesFromRegistrations([
      {
        kind: 'item',
        node: () => null,
        parent: undefined,
        props: () => ({ key: 'a', label: 'Label', icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children: snippet })
      }
    ]);
    expect(nodes[0].kind === 'item' && nodes[0].data.label).toBe('Label');
  });

  it('leaves out a component whose parent is not registered any more, and a second one with the same key', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const gone: Registration = { kind: 'group', node: () => null, parent: undefined, props: () => ({ label: 'x', class: undefined }) };
    const props = (key: string) => () => ({ key, label: undefined, icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children: undefined });
    const nodes = nodesFromRegistrations([
      { kind: 'item', node: () => null, parent: gone, props: props('orphan') },
      { kind: 'item', node: () => null, parent: undefined, props: props('same') },
      { kind: 'item', node: () => null, parent: undefined, props: props('same') }
    ]);
    expect(nodes.map((node) => node.key)).toEqual(['same']);
  });

  it('leaves out a submenu whose key is already used, and what is written inside it', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sub = (key: string): Registration => ({
      kind: 'submenu',
      node: () => null,
      parent: undefined,
      props: () => ({ key, label: key, icon: undefined, disabled: undefined, popupClassName: undefined, popupOffset: undefined, theme: undefined, ontitleclick: undefined, popupRender: undefined, class: undefined })
    });
    const first = sub('s');
    const second = sub('s');
    const child: Registration = {
      kind: 'item',
      node: () => null,
      parent: second as never,
      props: () => ({ key: 'child', label: 'Child', icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children: undefined })
    };
    const nodes = nodesFromRegistrations([first, second, child]);
    expect(nodes.map((node) => node.key)).toEqual(['s']);
    expect(nodes[0].kind === 'submenu' && nodes[0].children).toEqual([]);
  });

  it('keeps the order of the registrations while the markers are not in the document yet', () => {
    const props = (key: string) => () => ({ key, label: undefined, icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children: undefined });
    const nodes = nodesFromRegistrations([
      { kind: 'item', node: () => null, parent: undefined, props: props('one') },
      { kind: 'item', node: () => null, parent: undefined, props: props('two') }
    ]);
    expect(nodes.map((node) => node.key)).toEqual(['one', 'two']);
  });

  it('a marker that is the same element for two registrations keeps their order', () => {
    const element = document.createElement('span');
    const props = (key: string) => () => ({ key, label: undefined, icon: undefined, title: undefined, extra: undefined, disabled: undefined, danger: undefined, class: undefined, children: undefined });
    const nodes: MenuNode[] = nodesFromRegistrations([
      { kind: 'item', node: () => element, parent: undefined, props: props('one') },
      { kind: 'item', node: () => element, parent: undefined, props: props('two') }
    ]);
    expect(nodes.map((node) => node.key)).toEqual(['one', 'two']);
  });
});

describe('navigableItems, itemText', () => {
  function list(html: string): HTMLElement {
    const element = document.createElement('ul');
    element.innerHTML = html;
    document.body.append(element);
    return element;
  }

  it('finds items, item radios and item checkboxes that are not disabled, hidden or inert', () => {
    const element = list(`
      <li><div role="menuitem" id="a"></div></li>
      <li><div role="menuitemradio" id="b"></div></li>
      <li><div role="menuitemcheckbox" id="c"></div></li>
      <li><div role="menuitem" aria-disabled="true" id="d"></div></li>
      <li hidden><div role="menuitem" id="e"></div></li>
      <li inert><div role="menuitem" id="f"></div></li>
      <li><div role="presentation" id="g"></div></li>`);
    expect(navigableItems(element).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('itemText is the text of the content, trimmed, in lower case; or the text of the item', () => {
    const element = list(`
      <li><div role="menuitem" id="a"><span class="ads-menu-item-icon">★</span><span class="ads-menu-item-content">  Alpha </span></div></li>
      <li><div role="menuitem" id="b">Bare</div></li>`);
    expect(itemText(element.querySelector('#a') as HTMLElement)).toBe('alpha');
    expect(itemText(element.querySelector('#b') as HTMLElement)).toBe('bare');
  });
});

describe('matchTypeahead', () => {
  const texts = ['alpha', 'apple', 'beta', 'banana', 'cherry'];

  it('one character goes to the next item that starts with it, wrapping', () => {
    expect(matchTypeahead(texts, 0, 'a')).toBe(1);
    expect(matchTypeahead(texts, 1, 'a')).toBe(0);
    expect(matchTypeahead(texts, 4, 'b')).toBe(2);
    expect(matchTypeahead(texts, -1, 'c')).toBe(4);
  });

  it('the same character again and again cycles through the items that start with it', () => {
    expect(matchTypeahead(texts, 2, 'bb')).toBe(3);
    expect(matchTypeahead(texts, 3, 'bbb')).toBe(2);
  });

  it('a longer text is a prefix, and may stay on the current item', () => {
    expect(matchTypeahead(texts, 1, 'ap')).toBe(1);
    expect(matchTypeahead(texts, 0, 'ap')).toBe(1);
    expect(matchTypeahead(texts, 0, 'ba')).toBe(3);
  });

  it('is -1 when nothing starts with it, and for no text', () => {
    expect(matchTypeahead(texts, 0, 'x')).toBe(-1);
    expect(matchTypeahead(texts, 0, '')).toBe(-1);
    expect(matchTypeahead([], 0, 'a')).toBe(-1);
  });
});
