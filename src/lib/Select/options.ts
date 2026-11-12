/**
 * Logic of `Select` that does not need Svelte, kept apart so it is easy to test: the options and their
 * normal form, the search filter, the movement of the highlight, the type-ahead and the token separators.
 */
import type { Snippet } from 'svelte';
import { isProduction } from '../internal/env.js';
import type { GroupRegistration, Registration } from './context.js';
import type {
  SelectFieldNames,
  SelectOptionItem,
  SelectOptionData,
  SelectSize,
  SelectStatus,
  SelectValue
} from './types.js';

export const SELECT_MODES = ['multiple', 'tags', 'default'] as const;
export const SELECT_SIZES = ['large', 'medium', 'middle', 'small', 'default'] as const;
export const SELECT_VARIANTS = ['outlined', 'filled', 'borderless', 'underlined'] as const;
export const SELECT_PLACEMENTS = ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'] as const;

/** `middle` and `default` are aliases of `medium`. */
export function normalizeSize(size: SelectSize): 'large' | 'medium' | 'small' {
  return size === 'large' || size === 'small' ? size : 'medium';
}

/**
 * The validated status. Anything but `error`, `warning` or nothing throws while developing, and means "no
 * status" in a production build, so a bad value cannot paint the field as invalid.
 */
export function resolveStatus(status: unknown): SelectStatus | undefined {
  if (status === undefined || status === null) return undefined;
  if (status === 'error' || status === 'warning') return status;
  if (!isProduction()) throw new RangeError('Select status must be one of: error, warning.');
  return undefined;
}

/** One option in its normal form: what the list, the field, the search and the callbacks read. */
export interface SelectEntry {
  value: SelectValue;
  /** What is drawn; `undefined` means the text. */
  label: string | number | Snippet | undefined;
  /** The plain text: the label when it is a string, else the title, else the value. */
  text: string;
  title: string | undefined;
  disabled: boolean;
  class: string | undefined;
  /** The object that the callbacks and `filterOption` receive. */
  data: SelectOptionItem;
  /** The content of the item in the list, for a `SelectOption` written as markup. */
  children: Snippet | undefined;
}

export interface SelectGroupEntry {
  label: string | number | Snippet;
  /** The plain text of the label (for the accessible name and the search of groups). */
  text: string;
  title: string | undefined;
  class: string | undefined;
  options: SelectEntry[];
}

export type SelectNode =
  | { kind: 'option'; entry: SelectEntry }
  | { kind: 'group'; group: SelectGroupEntry };

export interface ResolvedFieldNames {
  label: string;
  value: string;
  options: string;
  groupLabel: string;
}

export function resolveFieldNames(names: SelectFieldNames | undefined): ResolvedFieldNames {
  const label = names?.label ?? 'label';
  return {
    label,
    value: names?.value ?? 'value',
    options: names?.options ?? 'options',
    groupLabel: names?.groupLabel ?? label
  };
}

export function isSelectValue(value: unknown): value is SelectValue {
  return typeof value === 'string' || typeof value === 'number';
}

/** The text of an option: its label when that is text, otherwise its title, otherwise its value. */
export function optionText(label: unknown, title: string | undefined, value: SelectValue): string {
  if (typeof label === 'string') return label;
  if (typeof label === 'number') return String(label);
  return title ?? String(value);
}

/** A label that can be drawn: text, a number or a snippet. Anything else is no label. */
function drawable(label: unknown): string | number | Snippet | undefined {
  return typeof label === 'string' || typeof label === 'number' || typeof label === 'function'
    ? (label as string | number | Snippet)
    : undefined;
}

export function buildEntry(
  value: SelectValue,
  label: unknown,
  disabled: unknown,
  title: unknown,
  extraClass: unknown,
  data: SelectOptionItem,
  children?: Snippet
): SelectEntry {
  const titleText = typeof title === 'string' ? title : undefined;
  return {
    value,
    label: drawable(label),
    text: optionText(label, titleText, value),
    title: titleText,
    disabled: Boolean(disabled),
    class: typeof extraClass === 'string' ? extraClass : undefined,
    data,
    children
  };
}

export function buildGroup(
  label: unknown,
  title: unknown,
  extraClass: unknown,
  options: SelectEntry[]
): SelectGroupEntry {
  const drawn = drawable(label) ?? '';
  return {
    label: drawn,
    text: typeof drawn === 'function' ? '' : String(drawn),
    title: typeof title === 'string' ? title : undefined,
    class: typeof extraClass === 'string' ? extraClass : undefined,
    options
  };
}

/** An entry of `options` that is not a group, as an entry; `undefined` when it has no usable value. */
function entryOf(raw: unknown, names: ResolvedFieldNames): SelectEntry | undefined {
  if (isSelectValue(raw)) {
    const data: SelectOptionItem = { value: raw, label: String(raw) };
    return buildEntry(raw, data.label, false, undefined, undefined, data);
  }
  if (typeof raw !== 'object' || raw === null) return undefined;
  const record = raw as Record<string, unknown>;
  const value = record[names.value];
  if (!isSelectValue(value)) return undefined;
  return buildEntry(value, record[names.label], record.disabled, record.title, record.class, record as SelectOptionItem);
}

/** The `options` prop as nodes: options and groups in their order. Entries that are not options are skipped. */
export function normalizeOptions(
  options: ReadonlyArray<SelectOptionData>,
  names: ResolvedFieldNames
): SelectNode[] {
  const nodes: SelectNode[] = [];
  for (const raw of options) {
    const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : undefined;
    const members = record?.[names.options];
    if (record && Array.isArray(members)) {
      const entries = members.flatMap((member) => entryOf(member, names) ?? []);
      nodes.push({ kind: 'group', group: buildGroup(record[names.groupLabel], record.title, record.class, entries) });
      continue;
    }
    const entry = entryOf(raw, names);
    if (entry) nodes.push({ kind: 'option', entry });
  }
  return nodes;
}

/** Every option of the nodes in the order of the list, groups left out. */
export function flattenNodes(nodes: readonly SelectNode[]): SelectEntry[] {
  return nodes.flatMap((node) => (node.kind === 'option' ? [node.entry] : node.group.options));
}

/** The entry of each value: the first option of a value is the one that counts. */
export function entriesByValue(entries: readonly SelectEntry[]): Map<SelectValue, SelectEntry> {
  const map = new Map<SelectValue, SelectEntry>();
  for (const entry of entries) if (!map.has(entry.value)) map.set(entry.value, entry);
  return map;
}

/** The place of each entry in the list. */
export function indexEntries(entries: readonly SelectEntry[]): Map<SelectEntry, number> {
  return new Map(entries.map((entry, index) => [entry, index] as const));
}

/** The entry of a value that matches no option: it is shown as its own text. */
export function orphanEntry(value: SelectValue): SelectEntry {
  return buildEntry(value, String(value), false, undefined, undefined, { value, label: String(value) });
}

export interface FilterSettings {
  /** The search text. */
  text: string;
  filterOption: boolean | ((input: string, option: SelectOptionItem) => boolean);
  filterProp: string | string[];
  filterSort: ((a: SelectOptionItem, b: SelectOptionItem, info: { searchValue: string }) => number) | undefined;
}

/** The text of the field `key` of an option, for the search: `label` is its text, `value` its value as text. */
export function fieldText(entry: SelectEntry, key: string): string {
  if (key === 'label') return entry.text;
  if (key === 'value') return String(entry.value);
  const field = entry.data[key];
  return isSelectValue(field) ? String(field) : '';
}

/** The default filter: a case-insensitive "contains" on any of the named fields. */
export function matchesText(entry: SelectEntry, input: string, filterProp: string | string[]): boolean {
  const needle = input.toLowerCase();
  const keys = Array.isArray(filterProp) ? filterProp : [filterProp];
  return keys.some((key) => fieldText(entry, key).toLowerCase().includes(needle));
}

/**
 * The nodes that remain for the search text, in the order `filterSort` gives. With no text, or with
 * `filterOption={false}`, the list is left as given. A group with no option left is dropped.
 */
export function filterNodes(nodes: readonly SelectNode[], settings: FilterSettings): SelectNode[] {
  const { text, filterOption, filterSort } = settings;
  const filtering = text !== '' && filterOption !== false;
  const keep = (entry: SelectEntry): boolean => {
    if (!filtering) return true;
    return typeof filterOption === 'function'
      ? filterOption(text, entry.data)
      : matchesText(entry, text, settings.filterProp);
  };
  const order = (entries: SelectEntry[]): SelectEntry[] =>
    filtering && filterSort
      ? [...entries].sort((a, b) => filterSort(a.data, b.data, { searchValue: text }))
      : entries;

  const result: SelectNode[] = [];
  // Options written one after another at the top level are ordered together; a group is ordered inside.
  let run: SelectEntry[] = [];
  const flush = () => {
    for (const entry of order(run)) result.push({ kind: 'option', entry });
    run = [];
  };
  for (const node of nodes) {
    if (node.kind === 'option') {
      if (keep(node.entry)) run.push(node.entry);
      continue;
    }
    flush();
    const options = order(node.group.options.filter(keep));
    if (options.length > 0) result.push({ kind: 'group', group: { ...node.group, options } });
  }
  flush();
  return result;
}

type Disabled = (entry: SelectEntry) => boolean;

/** The nearest enabled entry from `from` (included) in the direction `step`; -1 when there is none. */
export function seekEnabled(entries: readonly SelectEntry[], from: number, step: 1 | -1, isDisabled: Disabled): number {
  for (let index = from; index >= 0 && index < entries.length; index += step) {
    if (!isDisabled(entries[index])) return index;
  }
  return -1;
}

/**
 * Where the highlight goes when it moves `delta` entries from `from` (-1: nothing is highlighted yet).
 * Disabled entries are skipped and the movement stops at the ends. Returns -1 when no entry can be highlighted.
 */
export function moveActive(entries: readonly SelectEntry[], from: number, delta: number, isDisabled: Disabled): number {
  const step = delta > 0 ? 1 : -1;
  if (from < 0) return seekEnabled(entries, step > 0 ? 0 : entries.length - 1, step, isDisabled);
  const target = Math.min(Math.max(from + delta, 0), entries.length - 1);
  const ahead = seekEnabled(entries, target, step, isDisabled);
  if (ahead !== -1) return ahead;
  const behind = seekEnabled(entries, target, step === 1 ? -1 : 1, isDisabled);
  return behind === -1 ? from : behind;
}

/**
 * The entry that the typed characters point at (the type-ahead of a field that cannot search): the first
 * enabled entry after `from` whose text starts with them. Typing one character again and again cycles through
 * the entries that start with it. -1 when nothing matches.
 */
export function typeAheadIndex(entries: readonly SelectEntry[], from: number, typed: string, isDisabled: Disabled): number {
  if (typed === '' || entries.length === 0) return -1;
  const needle = typed.toLowerCase();
  const characters = [...needle];
  const cycling = characters.every((character) => character === characters[0]);
  const key = cycling ? characters[0] : needle;
  const start = cycling ? from + 1 : Math.max(from, 0);
  for (let offset = 0; offset < entries.length; offset++) {
    const index = (start + offset) % entries.length;
    const entry = entries[index];
    if (!isDisabled(entry) && entry.text.toLowerCase().startsWith(key)) return index;
  }
  return -1;
}

/** Whether the text has one of the separators in it. */
export function hasSeparator(text: string, separators: readonly string[]): boolean {
  return separators.some((separator) => separator !== '' && text.includes(separator));
}

/** The parts of the text between the separators, trimmed, without the empty ones. */
export function splitTokens(text: string, separators: readonly string[]): string[] {
  let parts = [text];
  for (const separator of separators) {
    if (separator !== '') parts = parts.flatMap((part) => part.split(separator));
  }
  return parts.map((part) => part.trim()).filter((part) => part !== '');
}

/** Text cut to `max` characters with an ellipsis; as it is when `max` is not set or it is short enough. */
export function clipTagText(text: string, max: number | undefined): string {
  if (max === undefined) return text;
  const characters = [...text];
  return characters.length > max ? `${characters.slice(0, max).join('')}...` : text;
}

/** The text of the line that announces the number of matches. */
export function defaultResultsText(count: number): string {
  return count === 1 ? '1 result' : `${count} results`;
}

// `Node.compareDocumentPosition` bit, written out so that nothing here needs the `Node` global (a server render).
const POSITION_FOLLOWING = 4;

/** Orders by the position of the markers in the document; registrations without a marker (yet) keep their order. */
function compareMarkup(a: Registration, b: Registration): number {
  const first = a.node();
  const second = b.node();
  if (!first || !second || first === second) return 0;
  // Two different nodes: the second one follows the first or precedes it.
  return first.compareDocumentPosition(second) & POSITION_FOLLOWING ? -1 : 1;
}

/**
 * The options and groups written as markup (`SelectOption`, `SelectOptGroup`) as nodes, in the order they were
 * written. An option belongs to the group it was written inside.
 */
export function nodesFromRegistrations(registrations: readonly Registration[]): SelectNode[] {
  const nodes: SelectNode[] = [];
  const groups = new Map<GroupRegistration, SelectGroupEntry>();
  for (const registration of [...registrations].sort(compareMarkup)) {
    if (registration.kind === 'group') {
      const props = registration.props();
      const group = buildGroup(props.label, props.title, props.class, []);
      groups.set(registration, group);
      nodes.push({ kind: 'group', group });
      continue;
    }
    const props = registration.props();
    if (!isSelectValue(props.value)) continue;
    const data: SelectOptionItem = {
      value: props.value,
      label: props.label,
      disabled: props.disabled,
      title: props.title,
      class: props.class
    };
    const entry = buildEntry(props.value, props.label, props.disabled, props.title, props.class, data, props.children);
    const group = registration.group ? groups.get(registration.group) : undefined;
    if (group) group.options.push(entry);
    else nodes.push({ kind: 'option', entry });
  }
  return nodes;
}
