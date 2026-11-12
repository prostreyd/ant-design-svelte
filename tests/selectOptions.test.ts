// The logic of Select that needs no Svelte: the options in their normal form, the search filter, the movement of
// the highlight, the type-ahead and the token separators (src/lib/Select/options.ts).
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GroupRegistration, OptionRegistration } from '../src/lib/Select/context';
import {
  buildEntry,
  clipTagText,
  defaultResultsText,
  fieldText,
  filterNodes,
  flattenNodes,
  hasSeparator,
  matchesText,
  moveActive,
  nodesFromRegistrations,
  normalizeOptions,
  normalizeSize,
  optionText,
  orphanEntry,
  resolveFieldNames,
  resolveStatus,
  seekEnabled,
  splitTokens,
  typeAheadIndex,
  type FilterSettings,
  type SelectEntry,
  type SelectNode
} from '../src/lib/Select/options';
import type { SelectOptionItem } from '../src/lib/Select/types';

afterEach(() => vi.unstubAllEnvs());

const names = resolveFieldNames(undefined);
const entriesOf = (nodes: SelectNode[]) => flattenNodes(nodes);
const valuesOf = (nodes: SelectNode[]) => entriesOf(nodes).map((entry) => entry.value);
const settings = (text: string, extra: Partial<FilterSettings> = {}): FilterSettings => ({
  text,
  filterOption: true,
  filterProp: 'label',
  filterSort: undefined,
  ...extra
});

describe('resolveFieldNames', () => {
  it('defaults: label, value, options; the group label follows the label key', () => {
    expect(resolveFieldNames(undefined)).toEqual({ label: 'label', value: 'value', options: 'options', groupLabel: 'label' });
  });

  it('a mapped label key is also the group label key unless groupLabel is set', () => {
    expect(resolveFieldNames({ label: 'name' }).groupLabel).toBe('name');
    expect(resolveFieldNames({ label: 'name', groupLabel: 'title' }).groupLabel).toBe('title');
  });

  it('maps value and options keys', () => {
    expect(resolveFieldNames({ value: 'id', options: 'items' })).toMatchObject({ value: 'id', options: 'items' });
  });
});

describe('optionText', () => {
  it('is the label when it is text, a number as text, else the title, else the value', () => {
    expect(optionText('Alpha', 'T', 'a')).toBe('Alpha');
    expect(optionText(5, 'T', 'a')).toBe('5');
    expect(optionText(createRawSnippet(() => ({ render: () => '<b>x</b>' })), 'Title', 'a')).toBe('Title');
    expect(optionText(undefined, undefined, 'a')).toBe('a');
    expect(optionText(undefined, undefined, 7)).toBe('7');
  });
});

describe('normalizeOptions', () => {
  it('a string or a number is both the value and the label', () => {
    const nodes = normalizeOptions(['a', 2], names);
    expect(entriesOf(nodes).map((entry) => [entry.value, entry.text, entry.label])).toEqual([
      ['a', 'a', 'a'],
      [2, '2', '2']
    ]);
    expect(entriesOf(nodes)[1].data).toEqual({ value: 2, label: '2' });
  });

  it('an object is an option; disabled, title and class are read; the object itself goes to the callbacks', () => {
    const raw = { value: 'a', label: 'Alpha', disabled: true, title: 'tip', class: 'x', extra: 1 };
    const [entry] = entriesOf(normalizeOptions([raw], names));
    expect(entry).toMatchObject({ value: 'a', text: 'Alpha', disabled: true, title: 'tip', class: 'x' });
    expect(entry.data).toBe(raw);
  });

  it('a snippet label is drawn and the text falls back to the title, then the value', () => {
    const label = createRawSnippet(() => ({ render: () => '<b>x</b>' }));
    const [withTitle, bare] = entriesOf(normalizeOptions([{ value: 'a', label, title: 'Tip' }, { value: 'b', label }], names));
    expect(withTitle.label).toBe(label);
    expect(withTitle.text).toBe('Tip');
    expect(bare.text).toBe('b');
  });

  it('an object with an options array is a group, with its label, title and class', () => {
    const [node] = normalizeOptions(
      [{ label: 'Group', title: 'T', class: 'g', options: [{ value: 1, label: 'One' }, 'two', { nothing: true }, null as never] }],
      names
    );
    expect(node.kind).toBe('group');
    if (node.kind !== 'group') return;
    expect(node.group).toMatchObject({ label: 'Group', text: 'Group', title: 'T', class: 'g' });
    expect(node.group.options.map((entry) => entry.value)).toEqual([1, 'two']);
  });

  it('a group label can be a number or a snippet; no label is an empty text', () => {
    const snippet = createRawSnippet(() => ({ render: () => '<i>g</i>' }));
    const nodes = normalizeOptions(
      [
        { label: 7, options: ['a'] },
        { label: snippet, options: ['b'] },
        { options: ['c'] }
      ],
      names
    );
    const groups = nodes.map((node) => (node.kind === 'group' ? node.group : undefined));
    expect(groups[0]?.text).toBe('7');
    expect(groups[1]?.label).toBe(snippet);
    expect(groups[1]?.text).toBe('');
    expect(groups[2]?.label).toBe('');
  });

  it('fieldNames map the keys of options, groups and the group label', () => {
    const mapped = resolveFieldNames({ label: 'name', value: 'id', options: 'items', groupLabel: 'title' });
    const nodes = normalizeOptions(
      [{ id: 1, name: 'One' }, { title: 'Group', items: [{ id: 2, name: 'Two' }] }],
      mapped
    );
    expect(entriesOf(nodes).map((entry) => [entry.value, entry.text])).toEqual([
      [1, 'One'],
      [2, 'Two']
    ]);
    const group = nodes[1];
    expect(group.kind === 'group' && group.group.text).toBe('Group');
  });

  it('skips what is not an option: no value, a value that is not text or a number, null, a boolean', () => {
    const nodes = normalizeOptions([{ label: 'x' }, { value: { id: 1 } }, null as never, true as never, { value: 'ok' }], names);
    expect(valuesOf(nodes)).toEqual(['ok']);
  });

  it('a label that is not drawable is no label', () => {
    const [entry] = entriesOf(normalizeOptions([{ value: 'a', label: { nope: true } }], names));
    expect(entry.label).toBeUndefined();
    expect(entry.text).toBe('a');
  });

  it('flattenNodes lists the options of groups in order', () => {
    const nodes = normalizeOptions(['a', { label: 'G', options: ['b', 'c'] }, 'd'], names);
    expect(valuesOf(nodes)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('orphanEntry is a value shown as its own text', () => {
    expect(orphanEntry('zzz')).toMatchObject({ value: 'zzz', text: 'zzz', disabled: false });
  });
});

describe('status and size', () => {
  it('normalizeSize: large and small stay, everything else is medium', () => {
    expect(normalizeSize('large')).toBe('large');
    expect(normalizeSize('small')).toBe('small');
    expect(normalizeSize('medium')).toBe('medium');
    expect(normalizeSize('middle')).toBe('medium');
    expect(normalizeSize('default')).toBe('medium');
  });

  it('resolveStatus: error, warning and nothing pass; anything else throws in development, is none in production', () => {
    expect(resolveStatus(undefined)).toBeUndefined();
    expect(resolveStatus(null)).toBeUndefined();
    expect(resolveStatus('error')).toBe('error');
    expect(resolveStatus('warning')).toBe('warning');
    expect(() => resolveStatus('bad')).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    expect(resolveStatus('bad')).toBeUndefined();
  });
});

describe('filterNodes', () => {
  const nodes = () =>
    normalizeOptions(
      [
        { value: 'a', label: 'Alpha', code: 'x1' },
        { value: 'b', label: 'Beta', code: 'y2' },
        { label: 'Group', options: [{ value: 'c', label: 'Gamma' }, { value: 'd', label: 'Alphabet' }] },
        { label: 'Other', options: [{ value: 'e', label: 'Epsilon' }] },
        { value: 'f', label: 'Phi' }
      ],
      names
    );

  it('no text: the list is as given, groups included', () => {
    expect(filterNodes(nodes(), settings('')).map((node) => node.kind)).toEqual(['option', 'option', 'group', 'group', 'option']);
  });

  it('the default filter is a case-insensitive "contains" on the label', () => {
    expect(valuesOf(filterNodes(nodes(), settings('ALPH')))).toEqual(['a', 'd']);
  });

  it('a group with no match is dropped, and a group keeps only its matches', () => {
    const result = filterNodes(nodes(), settings('alpha'));
    expect(result.map((node) => node.kind)).toEqual(['option', 'group']);
    const group = result[1];
    expect(group.kind === 'group' && group.group.options.map((entry) => entry.value)).toEqual(['d']);
  });

  it('optionFilterProp names the field: value, a custom key, or several (OR)', () => {
    expect(valuesOf(filterNodes(nodes(), settings('y2', { filterProp: 'code' })))).toEqual(['b']);
    expect(valuesOf(filterNodes(nodes(), settings('c', { filterProp: 'value' })))).toEqual(['c']);
    expect(valuesOf(filterNodes(nodes(), settings('x1', { filterProp: ['label', 'code'] })))).toEqual(['a']);
    expect(valuesOf(filterNodes(nodes(), settings('eps', { filterProp: ['label', 'code'] })))).toEqual(['e']);
  });

  it('a function decides per option and gets the text and the option object', () => {
    const seen: unknown[] = [];
    const result = filterNodes(
      nodes(),
      settings('x', {
        filterOption: (input: string, option: SelectOptionItem) => {
          seen.push([input, option.value]);
          return option.value === 'f';
        }
      })
    );
    expect(valuesOf(result)).toEqual(['f']);
    expect(seen[0]).toEqual(['x', 'a']);
  });

  it('filterOption false leaves the list as given, and sort is not applied', () => {
    const sort = vi.fn<NonNullable<FilterSettings['filterSort']>>(() => 0);
    const result = filterNodes(nodes(), settings('zzz', { filterOption: false, filterSort: sort }));
    expect(valuesOf(result)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(sort).not.toHaveBeenCalled();
  });

  it('filterSort orders the top-level options and the options of a group, with the search text', () => {
    const sort = vi.fn<NonNullable<FilterSettings['filterSort']>>((a, b) => String(b.label).localeCompare(String(a.label)));
    const result = filterNodes(nodes(), settings('a', { filterSort: sort }));
    // The top-level run before the group (Alpha, Beta) is ordered descending, and so is the group (Gamma, Alphabet).
    expect(valuesOf(result)).toEqual(['b', 'a', 'c', 'd']);
    expect(sort.mock.calls[0][2]).toEqual({ searchValue: 'a' });
  });

  it('filterSort is not applied without a search text', () => {
    const sort = vi.fn<NonNullable<FilterSettings['filterSort']>>(() => 1);
    filterNodes(nodes(), settings('', { filterSort: sort }));
    expect(sort).not.toHaveBeenCalled();
  });

  it('fieldText: label is the text, value is the value as text, other keys are read from the object, missing keys are empty', () => {
    const [entry] = entriesOf(normalizeOptions([{ value: 7, label: 'Seven', code: 'k', nested: { a: 1 } }], names));
    expect(fieldText(entry, 'label')).toBe('Seven');
    expect(fieldText(entry, 'value')).toBe('7');
    expect(fieldText(entry, 'code')).toBe('k');
    expect(fieldText(entry, 'nested')).toBe('');
    expect(fieldText(entry, 'missing')).toBe('');
    expect(matchesText(entry, 'sev', 'label')).toBe(true);
  });
});

describe('moving the highlight', () => {
  const entries = (...flags: boolean[]): SelectEntry[] =>
    flags.map((disabled, index) => buildEntry(index, `o${index}`, disabled, undefined, undefined, { value: index }));
  const isDisabled = (entry: SelectEntry) => entry.disabled;

  it('seekEnabled finds the nearest enabled entry in a direction, or -1', () => {
    const list = entries(true, false, true, false);
    expect(seekEnabled(list, 0, 1, isDisabled)).toBe(1);
    expect(seekEnabled(list, 2, 1, isDisabled)).toBe(3);
    expect(seekEnabled(list, 2, -1, isDisabled)).toBe(1);
    expect(seekEnabled(list, 0, -1, isDisabled)).toBe(-1);
    expect(seekEnabled(entries(true, true), 0, 1, isDisabled)).toBe(-1);
    expect(seekEnabled([], 0, 1, isDisabled)).toBe(-1);
  });

  it('moveActive: next and previous, skipping disabled entries, stopping at the ends', () => {
    const list = entries(false, true, false, false);
    expect(moveActive(list, 0, 1, isDisabled)).toBe(2);
    expect(moveActive(list, 2, -1, isDisabled)).toBe(0);
    expect(moveActive(list, 3, 1, isDisabled)).toBe(3);
    expect(moveActive(list, 0, -1, isDisabled)).toBe(0);
  });

  it('moveActive: with nothing highlighted the first or the last enabled entry', () => {
    const list = entries(true, false, false, true);
    expect(moveActive(list, -1, 1, isDisabled)).toBe(1);
    expect(moveActive(list, -1, -1, isDisabled)).toBe(2);
    expect(moveActive([], -1, 1, isDisabled)).toBe(-1);
  });

  it('moveActive: a page jump lands on the entry that far away, or the nearest enabled one, or the end', () => {
    const list = entries(...Array.from({ length: 25 }, (_, index) => index === 10 || index === 24));
    expect(moveActive(list, 0, 10, isDisabled)).toBe(11);
    expect(moveActive(list, 12, 10, isDisabled)).toBe(22);
    expect(moveActive(list, 14, 10, isDisabled)).toBe(23);
    expect(moveActive(list, 23, 10, isDisabled)).toBe(23);
    expect(moveActive(list, 20, -10, isDisabled)).toBe(9);
    expect(moveActive(list, 3, -10, isDisabled)).toBe(0);
  });

  it('moveActive stays where it is when nothing else can be highlighted', () => {
    const list = entries(false, true, true);
    expect(moveActive(list, 0, 1, isDisabled)).toBe(0);
    // Not even the entry it is on can be highlighted any more.
    expect(moveActive(entries(true, true, true), 1, 1, isDisabled)).toBe(1);
  });

  it('moveActive going up finds the nearest enabled entry behind the target when nothing is enabled ahead', () => {
    const list = entries(true, true, false);
    expect(moveActive(list, 2, -1, isDisabled)).toBe(2);
  });
});

describe('typeAheadIndex', () => {
  const list = ['Apple', 'Apricot', 'Banana', 'Avocado', 'Blueberry'].map((text, index) =>
    buildEntry(index, text, index === 1, undefined, undefined, { value: index })
  );
  const isDisabled = (entry: SelectEntry) => entry.disabled;

  it('the first enabled entry that starts with the typed text, case-insensitive', () => {
    expect(typeAheadIndex(list, -1, 'b', isDisabled)).toBe(2);
    expect(typeAheadIndex(list, -1, 'BL', isDisabled)).toBe(4);
    expect(typeAheadIndex(list, 0, 'ap', isDisabled)).toBe(0);
  });

  it('a disabled entry is skipped', () => {
    expect(typeAheadIndex(list, -1, 'apr', isDisabled)).toBe(-1);
  });

  it('one character typed again and again cycles through the entries that start with it', () => {
    expect(typeAheadIndex(list, -1, 'a', isDisabled)).toBe(0);
    expect(typeAheadIndex(list, 0, 'a', isDisabled)).toBe(3);
    expect(typeAheadIndex(list, 3, 'a', isDisabled)).toBe(0);
    expect(typeAheadIndex(list, 3, 'aa', isDisabled)).toBe(0);
  });

  it('nothing typed, nothing listed, or no match is -1', () => {
    expect(typeAheadIndex(list, 0, '', isDisabled)).toBe(-1);
    expect(typeAheadIndex([], 0, 'a', isDisabled)).toBe(-1);
    expect(typeAheadIndex(list, 0, 'z', isDisabled)).toBe(-1);
  });
});

describe('tokens and text helpers', () => {
  it('hasSeparator tells whether any separator is in the text; an empty separator never matches', () => {
    expect(hasSeparator('a,b', [','])).toBe(true);
    expect(hasSeparator('a b', [',', ' '])).toBe(true);
    expect(hasSeparator('ab', [','])).toBe(false);
    expect(hasSeparator('ab', [''])).toBe(false);
    expect(hasSeparator('ab', [])).toBe(false);
  });

  it('splitTokens cuts at every separator, trims and drops the empty parts', () => {
    expect(splitTokens('Lucy, Jack;Tom,', [',', ';'])).toEqual(['Lucy', 'Jack', 'Tom']);
    expect(splitTokens('a', [''])).toEqual(['a']);
    expect(splitTokens(' , ', [','])).toEqual([]);
  });

  it('clipTagText cuts long text with an ellipsis and leaves the rest', () => {
    expect(clipTagText('abcdef', 3)).toBe('abc...');
    expect(clipTagText('abc', 3)).toBe('abc');
    expect(clipTagText('abc', undefined)).toBe('abc');
    expect(clipTagText('😀😀😀😀', 2)).toBe('😀😀...');
  });

  it('defaultResultsText: "1 result", "N results"', () => {
    expect(defaultResultsText(1)).toBe('1 result');
    expect(defaultResultsText(0)).toBe('0 results');
    expect(defaultResultsText(12)).toBe('12 results');
  });
});

describe('nodesFromRegistrations', () => {
  /** A registration whose marker is an element at a place of a real document. */
  const marker = (parent: HTMLElement) => parent.appendChild(document.createElement('span'));
  const option = (value: string, node: Element | null, group?: GroupRegistration, extra: object = {}): OptionRegistration => ({
    kind: 'option',
    node: () => node,
    group,
    props: () => ({ value, label: undefined, disabled: undefined, title: undefined, class: undefined, children: undefined, ...extra })
  });
  const group = (label: string, node: Element | null): GroupRegistration => ({ kind: 'group', node: () => node, props: () => ({ label, title: undefined, class: undefined }) });

  it('orders by the position of the markers in the document, not by registration order', () => {
    const host = document.createElement('div');
    const first = marker(host);
    const second = marker(host);
    const third = marker(host);
    const nodes = nodesFromRegistrations([option('c', third), option('a', first), option('b', second)]);
    expect(valuesOf(nodes)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the registration order for entries without a marker (yet) and for the same marker', () => {
    const host = document.createElement('div');
    const one = marker(host);
    expect(valuesOf(nodesFromRegistrations([option('x', null), option('y', one), option('z', null)]))).toEqual(['x', 'y', 'z']);
    expect(valuesOf(nodesFromRegistrations([option('x', one), option('y', one)]))).toEqual(['x', 'y']);
  });

  it('an option belongs to the group it was written in; a group sits at its own position', () => {
    const host = document.createElement('div');
    const before = marker(host);
    const groupMarker = marker(host);
    const inside = marker(host);
    const after = marker(host);
    const g = group('Group', groupMarker);
    const nodes = nodesFromRegistrations([option('after', after), option('inside', inside, g), g, option('before', before)]);
    expect(nodes.map((node) => node.kind)).toEqual(['option', 'group', 'option']);
    const middle = nodes[1];
    expect(middle.kind === 'group' && middle.group.options.map((entry) => entry.value)).toEqual(['inside']);
    expect(middle.kind === 'group' && middle.group.text).toBe('Group');
  });

  it('an option whose group is not registered is a top-level option', () => {
    const lost = group('Lost', null);
    expect(nodesFromRegistrations([option('a', null, lost)]).map((node) => node.kind)).toEqual(['option']);
  });

  it('reads the props every time: value, label, disabled, title, class and children', () => {
    const [entry] = entriesOf(nodesFromRegistrations([option('a', null, undefined, { label: 'Alpha', disabled: true, title: 'T', class: 'c' })]));
    expect(entry).toMatchObject({ value: 'a', text: 'Alpha', disabled: true, title: 'T', class: 'c' });
    expect(entry.data).toMatchObject({ value: 'a', label: 'Alpha', disabled: true });
  });

  it('skips an option whose value is not text or a number', () => {
    expect(nodesFromRegistrations([option(undefined as never, null)])).toEqual([]);
  });
});
