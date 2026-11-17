/**
 * The global list of messages (specs/message.md).
 *
 * A message is opened by a call from code, from anywhere, so the list lives in this module and not in a component:
 * `message.success('Saved')` adds to it, and a `MessageHost` (or the layer the library creates itself) renders it.
 * The module knows nothing about Svelte; it keeps the timers, the keys, the limit and the settings, and tells its
 * listeners when something changed.
 *
 * On a server the list must stay empty: module state there is shared by every request, so a message opened while one
 * page is rendered would leak into the next. Every call on the server is a no-op that returns an inert handle.
 */
import { isProduction } from '../internal/env.js';
import type {
  MessageConfig,
  MessageConfigClassNames,
  MessageConfigStyles,
  MessageContainer,
  MessageContent,
  MessageHandle,
  MessageIcon,
  MessageLabels,
  MessageOptions,
  MessageType
} from './types.js';

export const DEFAULT_DURATION = 3;
export const DEFAULT_THRESHOLD = 3;
/** How long a closing message may stay if nothing reports the end of its exit motion, in milliseconds. */
export const EXIT_FALLBACK = 800;

export const DEFAULT_LABELS: Required<MessageLabels> = {
  info: 'Info',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  loading: 'Loading',
  close: 'Close'
};

/** Why the timer of a message stands still. Several reasons may hold at once; the timer runs when none does. */
export type PauseReason = 'hover' | 'focus' | 'pile' | 'hidden';

/** What a host renders for one message. A new object for every change, so that a comparison by identity is enough. */
export interface MessageRecord {
  readonly id: number;
  readonly key: string | number;
  /** Counts up with every update by key; a change re-creates the box so that a screen reader reads it again. */
  readonly revision: number;
  readonly state: 'open' | 'closing';
  readonly type: MessageType;
  readonly content: MessageContent;
  readonly icon: MessageIcon | undefined;
  readonly closable: boolean | undefined;
  readonly pauseOnHover: boolean;
  readonly class: string | undefined;
  readonly style: MessageOptions['style'];
  readonly classNames: MessageOptions['classNames'];
  readonly styles: MessageOptions['styles'];
  readonly onclick: MessageOptions['onclick'];
  /** When the message was first opened (milliseconds since the epoch). An update keeps it. */
  readonly createdAt: number;
}

/** The settings after the three layers are merged: `MessageHost` props over `message.config()` over the defaults. */
export interface MessageSettings {
  /** `undefined` leaves the distance to the token `--ads-message-top`. */
  top: number | string | undefined;
  duration: number;
  maxCount: number | undefined;
  container: MessageContainer | undefined;
  closable: boolean;
  labels: Required<MessageLabels>;
  classNames: MessageConfigClassNames;
  styles: MessageConfigStyles;
  stack: { enabled: boolean; threshold: number };
}

export interface Snapshot {
  readonly records: readonly MessageRecord[];
  readonly settings: MessageSettings;
  /** The id of the host that renders the messages, or `undefined` when no host is mounted. */
  readonly activeHost: number | undefined;
}

interface Entry {
  record: MessageRecord;
  onclose: (() => void) | undefined;
  durationMs: number;
  remaining: number;
  startedAt: number;
  timer: ReturnType<typeof setTimeout> | undefined;
  exitTimer: ReturnType<typeof setTimeout> | undefined;
  paused: Set<PauseReason>;
  closed: Promise<void>;
  resolveClosed: () => void;
}

interface HostEntry {
  id: number;
  settings: MessageConfig;
}

export interface HostRegistration {
  readonly id: number;
  update(settings: MessageConfig): void;
  dispose(): void;
}

let entries: Entry[] = [];
let config: MessageConfig = {};
const hosts: HostEntry[] = [];
const listeners = new Set<() => void>();
let nextId = 0;
let nextHostId = 0;
let snapshot: Snapshot | null = null;
let watchingVisibility = false;

const isServer = (): boolean => typeof document === 'undefined';

function warn(text: string): void {
  if (!isProduction()) console.warn(`Message: ${text}`);
}

function validDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1;
}

function mergeParts<T extends object>(base: T | undefined, over: T | undefined): T {
  return { ...base, ...over } as T;
}

function resolveSettings(): MessageSettings {
  const host = hosts.length > 0 ? hosts[hosts.length - 1].settings : {};
  const pick = <K extends keyof MessageConfig>(name: K): MessageConfig[K] => (host[name] !== undefined ? host[name] : config[name]);

  const durationValue = pick('duration');
  if (durationValue !== undefined && !validDuration(durationValue)) {
    warn('`duration` must be a non-negative number of seconds; the default is used.');
  }
  const stackValue = pick('stack');
  const threshold = typeof stackValue === 'object' && stackValue !== null ? stackValue.threshold : undefined;

  return {
    top: pick('top'),
    duration: validDuration(durationValue) ? durationValue : DEFAULT_DURATION,
    maxCount: validCount(pick('maxCount')) ? Math.floor(pick('maxCount') as number) : undefined,
    container: pick('container'),
    closable: pick('closable') ?? false,
    labels: { ...DEFAULT_LABELS, ...config.labels, ...host.labels },
    classNames: mergeParts(config.classNames, host.classNames),
    styles: mergeParts(config.styles, host.styles),
    stack: {
      enabled: stackValue === true || (typeof stackValue === 'object' && stackValue !== null),
      threshold: validCount(threshold) ? Math.floor(threshold) : DEFAULT_THRESHOLD
    }
  };
}

function notify(): void {
  snapshot = null;
  for (const listener of [...listeners]) listener();
}

/** The current state. The same object until something changes. */
export function getSnapshot(): Snapshot {
  snapshot ??= {
    records: entries.map((entry) => entry.record),
    settings: resolveSettings(),
    activeHost: hosts.length > 0 ? hosts[hosts.length - 1].id : undefined
  };
  return snapshot;
}

/** Calls `listener` after every change. Returns the function that stops it. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---- timers ----------------------------------------------------------------------------------------------------------

function clearTimer(entry: Entry): void {
  if (entry.timer !== undefined) clearTimeout(entry.timer);
  entry.timer = undefined;
}

function arm(entry: Entry): void {
  clearTimer(entry);
  if (entry.durationMs === 0 || entry.paused.size > 0 || entry.record.state !== 'open') return;
  entry.startedAt = Date.now();
  entry.timer = setTimeout(() => closeEntry(entry), entry.remaining);
}

function setReason(entry: Entry, reason: PauseReason, on: boolean): void {
  const was = entry.paused.size > 0;
  if (on) entry.paused.add(reason);
  else entry.paused.delete(reason);
  const now = entry.paused.size > 0;
  if (!was && now && entry.timer !== undefined) {
    // Remember how much of the time is left: the timer resumes with it, it does not start again.
    entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
    clearTimer(entry);
  } else if (was && !now) {
    arm(entry);
  }
}

/** Holds or releases the timer of a message for a reason (the pointer is over it, focus is in it, ...). */
export function setPaused(id: number, reason: PauseReason, on: boolean): void {
  const entry = entries.find((candidate) => candidate.record.id === id);
  if (entry) setReason(entry, reason, on);
}

function onVisibility(): void {
  for (const entry of entries) setReason(entry, 'hidden', document.hidden);
}

function watchVisibility(on: boolean): void {
  if (on === watchingVisibility) return;
  watchingVisibility = on;
  if (on) document.addEventListener('visibilitychange', onVisibility);
  else document.removeEventListener('visibilitychange', onVisibility);
}

// ---- closing ---------------------------------------------------------------------------------------------------------

function closeEntry(entry: Entry): void {
  if (entry.record.state !== 'open') return;
  clearTimer(entry);
  entry.record = { ...entry.record, state: 'closing' };
  // Nothing may keep a closing message on the page for good: if no host reports the end of its exit, this does.
  entry.exitTimer = setTimeout(() => finalize(entry.record.id), EXIT_FALLBACK);
  notify();
  entry.resolveClosed();
  entry.onclose?.();
}

/** Closes the open message with this id (the close button and Escape of a message use it). */
export function closeById(id: number): void {
  const entry = entries.find((candidate) => candidate.record.id === id);
  if (entry) closeEntry(entry);
}

/** Removes a closing message once its exit motion is over. A message that is still open is not touched. */
export function finalize(id: number): void {
  const entry = entries.find((candidate) => candidate.record.id === id);
  if (!entry || entry.record.state !== 'closing') return;
  clearTimeout(entry.exitTimer);
  entries = entries.filter((candidate) => candidate !== entry);
  if (entries.length === 0) watchVisibility(false);
  notify();
}

function enforceMaxCount(): void {
  const { maxCount } = resolveSettings();
  if (maxCount === undefined) return;
  const open = entries.filter((entry) => entry.record.state === 'open');
  for (const entry of open.slice(0, Math.max(0, open.length - maxCount))) closeEntry(entry);
}

// ---- the calls -------------------------------------------------------------------------------------------------------

function handleFor(entry: Entry): MessageHandle {
  return Object.assign(() => closeEntry(entry), {
    then: <A = void, B = never>(
      onfulfilled?: ((value: void) => A | PromiseLike<A>) | null,
      onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
    ): PromiseLike<A | B> => entry.closed.then(onfulfilled, onrejected)
  });
}

/** What a call returns where there is no page (a server): closing does nothing, and the promise is already settled. */
function inertHandle(): MessageHandle {
  return Object.assign(() => {}, {
    then: <A = void, B = never>(
      onfulfilled?: ((value: void) => A | PromiseLike<A>) | null,
      onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
    ): PromiseLike<A | B> => Promise.resolve().then(onfulfilled, onrejected)
  });
}

/** Opens a message, or updates the open one with the same key. */
export function openMessage(options: MessageOptions, type: MessageType): MessageHandle {
  if (isServer()) return inertHandle();

  const settings = resolveSettings();
  const duration = validDuration(options.duration) ? options.duration : settings.duration;
  if (options.duration !== undefined && !validDuration(options.duration)) {
    warn('`duration` must be a non-negative number of seconds; the default is used.');
  }

  const existing =
    options.key === undefined
      ? undefined
      : entries.find((entry) => entry.record.key === options.key && entry.record.state === 'open');

  const id = existing ? existing.record.id : ++nextId;
  const record: MessageRecord = {
    id,
    key: options.key ?? `ads-message-${id}`,
    revision: existing ? existing.record.revision + 1 : 0,
    state: 'open',
    type,
    content: options.content,
    icon: options.icon,
    closable: options.closable,
    pauseOnHover: options.pauseOnHover !== false,
    class: options.class,
    style: options.style,
    classNames: options.classNames,
    styles: options.styles,
    onclick: options.onclick,
    createdAt: existing ? existing.record.createdAt : Date.now()
  };

  if (existing) {
    existing.record = record;
    existing.onclose = options.onclose;
    existing.durationMs = duration * 1000;
    existing.remaining = existing.durationMs;
    arm(existing);
    notify();
    return handleFor(existing);
  }

  let resolveClosed!: () => void;
  const entry: Entry = {
    record,
    onclose: options.onclose,
    durationMs: duration * 1000,
    remaining: duration * 1000,
    startedAt: 0,
    timer: undefined,
    exitTimer: undefined,
    paused: new Set(),
    closed: new Promise<void>((resolve) => {
      resolveClosed = resolve;
    }),
    resolveClosed: () => resolveClosed()
  };
  if (document.hidden) entry.paused.add('hidden');
  entries = [...entries, entry];
  watchVisibility(true);
  arm(entry);
  enforceMaxCount();
  notify();
  return handleFor(entry);
}

/** Closes the open message with this key, or every open message. */
export function destroyMessages(key?: string | number): void {
  for (const entry of [...entries]) {
    if (key === undefined || entry.record.key === key) closeEntry(entry);
  }
}

/** Sets defaults for every message. A value of `undefined` takes a setting back to its default. */
export function setConfig(options: MessageConfig): void {
  const next: MessageConfig = { ...config };
  for (const name of Object.keys(options) as (keyof MessageConfig)[]) {
    const value = options[name];
    if (value === undefined) {
      delete next[name];
    } else if (name === 'labels' || name === 'classNames' || name === 'styles') {
      (next as Record<string, unknown>)[name] = { ...(config[name] as object | undefined), ...(value as object) };
    } else {
      (next as Record<string, unknown>)[name] = value;
    }
  }
  config = next;
  enforceMaxCount();
  notify();
}

// ---- hosts -----------------------------------------------------------------------------------------------------------

/**
 * Registers a `MessageHost`. The host mounted last is the active one: it renders the messages, and its props are
 * the settings that win over `message.config()`. Another host renders nothing.
 */
export function registerHost(settings: MessageConfig): HostRegistration {
  const host: HostEntry = { id: ++nextHostId, settings };
  hosts.push(host);
  enforceMaxCount();
  notify();
  return {
    id: host.id,
    update(next) {
      host.settings = next;
      enforceMaxCount();
      notify();
    },
    dispose() {
      const index = hosts.indexOf(host);
      if (index !== -1) hosts.splice(index, 1);
      notify();
    }
  };
}

/** Forgets everything: the messages, the timers, the settings and the hosts. For tests. */
export function resetMessages(): void {
  for (const entry of entries) {
    clearTimer(entry);
    clearTimeout(entry.exitTimer);
  }
  entries = [];
  config = {};
  hosts.length = 0;
  watchVisibility(false);
  notify();
}
