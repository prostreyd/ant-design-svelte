import type { FormNamePath, FormNamePathPart } from './types.js';

/** A name as a list of steps. A single step becomes a list of one. */
export function toPath(name: FormNamePath): FormNamePathPart[] {
  return Array.isArray(name) ? [...(name as readonly FormNamePathPart[])] : [name as FormNamePathPart];
}

const SEPARATOR = '\u0000';

/**
 * A string that is equal for equal paths, to key maps. `['users', 0]` and `['users', '0']` are the same key: both
 * address `users[0]`.
 */
export function pathKey(path: readonly FormNamePathPart[]): string {
  return path.map(String).join(SEPARATOR);
}

/** The path as a piece of an element id: the steps joined with `_`. */
export function pathId(path: readonly FormNamePathPart[]): string {
  return path.map(String).join('_');
}

/** The path as text for a message: `user.address.city`. */
export function pathText(path: readonly FormNamePathPart[]): string {
  return path.map(String).join('.');
}

const isContainer = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** The value at a path, or `undefined` where the path leaves the data. */
export function getIn(source: unknown, path: readonly FormNamePathPart[]): unknown {
  let current: unknown = source;
  for (const part of path) {
    if (!isContainer(current)) return undefined;
    current = (current as Record<string, unknown>)[part as string];
  }
  return current;
}

/**
 * Writes a value at a path, creating what is missing. A number step creates an array when the parent does not exist
 * yet; a string step creates an object (so `'0'` keeps an object).
 */
export function setIn(target: Record<string, unknown>, path: readonly FormNamePathPart[], value: unknown): void {
  if (path.length === 0) return;
  let current: Record<string, unknown> = target;
  for (let index = 0; index < path.length - 1; index++) {
    const part = path[index] as string;
    const next = current[part];
    if (!isContainer(next)) {
      current[part] = typeof path[index + 1] === 'number' ? [] : {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[path[path.length - 1] as string] = value;
}

/** Removes the value at a path (the key, or the element of an array). */
export function deleteIn(target: Record<string, unknown>, path: readonly FormNamePathPart[]): void {
  if (path.length === 0) return;
  const parent = getIn(target, path.slice(0, -1));
  if (!isContainer(parent)) return;
  const last = path[path.length - 1] as string;
  // An element of an array is emptied, not removed: removing it would shift the other fields of the list.
  if (Array.isArray(parent)) (parent as unknown as Record<string, unknown>)[last] = undefined;
  else delete (parent as Record<string, unknown>)[last];
}

/** Whether `prefix` is `path` or the start of it. */
export function isPrefix(prefix: readonly FormNamePathPart[], path: readonly FormNamePathPart[]): boolean {
  if (prefix.length > path.length) return false;
  return prefix.every((part, index) => String(part) === String(path[index]));
}

const isPlain = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/** A deep copy of plain objects, arrays and dates. Other values (functions, files, class instances) are kept as they are. */
export function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => clone(item)) as unknown as T;
  if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
  if (isPlain(value)) {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(value)) copy[key] = clone(value[key]);
    return copy as T;
  }
  return value;
}

/** Writes `source` into `target`: objects are merged key by key, everything else (arrays included) is replaced. */
export function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const incoming = source[key];
    const existing = target[key];
    if (isPlain(incoming) && isPlain(existing)) mergeDeep(existing, incoming);
    else target[key] = clone(incoming);
  }
}

/**
 * Writes what `source` has into `target`, only where `target` has `undefined`: values that are there stay, objects on both
 * sides are filled key by key. For the initial values of a model that the consumer owns.
 */
export function fillMissing(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const incoming = source[key];
    const existing = target[key];
    if (existing === undefined) target[key] = clone(incoming);
    else if (isPlain(incoming) && isPlain(existing)) fillMissing(existing, incoming);
  }
}

/** Whether two snapshots hold the same data: plain objects, arrays and dates are compared by content, `NaN` equals `NaN`. */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b || (a !== a && b !== b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => isEqual(item, b[index]));
  if (isPlain(a) && isPlain(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => key in b && isEqual(a[key], b[key]));
  }
  return false;
}

/**
 * The list found at a path of a rules object: `{ user: { name: [rule] } }` gives `[rule]` for `['user', 'name']`. Anything
 * that is not a list (a nested object, a missing key, a list met halfway) gives an empty list.
 */
export function lookupRules<T>(rules: unknown, path: readonly FormNamePathPart[]): readonly T[] {
  const found = getIn(rules, path);
  return Array.isArray(found) ? (found as T[]) : [];
}

/** The paths of the leaves of a nested value: what `setFieldsValue({ user: { name: 'a' } })` addresses. */
export function leafPaths(value: unknown, prefix: FormNamePathPart[] = []): FormNamePathPart[][] {
  if (isPlain(value) && Object.keys(value).length > 0) {
    return Object.keys(value).flatMap((key) => leafPaths(value[key], [...prefix, key]));
  }
  return prefix.length > 0 ? [prefix] : [];
}
