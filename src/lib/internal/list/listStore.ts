/**
 * The core of a global list of boxes that a call from code fills (specs/overlay.md, `list/`, LS1 to LS9): `message.success(...)`
 * and `notification.success(...)` add to a list that lives in a module and not in a component, and a host (or the layer the
 * library makes itself) draws it.
 *
 * One call of `createListStore` makes one independent list. The list keeps the records, the keys, the timers, the limit, the hosts
 * and the settings, and tells its listeners when something changed. It knows no Svelte and imports no component: what is specific to
 * a component (the fields of its record, its settings and their defaults, the form of the handle a call returns) is the component's.
 *
 * On a server the list must stay empty: module state there is shared by every request, so a box opened while one page is rendered
 * would leak into the next. `open` stores nothing there and returns `undefined`.
 *
 * A closure and not a class: private class fields are not known to Firefox 85, the browser floor.
 */
import { createPausableTimer, type PausableTimer } from '../timer/pausableTimer.js';

/** How long a closing record may stay if nothing reports the end of its exit motion, in milliseconds. */
export const EXIT_FALLBACK = 800;

/** Why the timer of a record stands still. Several reasons may hold at once; the timer runs when none does. */
export type PauseReason = 'hover' | 'focus' | 'pile' | 'hidden';

/**
 * Why a record closed: its time ran out (`timeout`), the user closed it (`user`: the close button, Escape), the limit pushed it out
 * (`replaced`), or code closed it (`destroy`: `destroy()` and the handle a call returned).
 */
export type CloseReason = 'timeout' | 'user' | 'replaced' | 'destroy';

/** What `timer(id)` says about the timer of a record. */
export interface TimerState {
  /** Milliseconds left (0 for a record that is closing, or one that never closes by time). */
  readonly remaining: number;
  /** A reason holds the timer. */
  readonly paused: boolean;
}

/** What every record has. A component adds its own fields; the list never reads them. */
export interface ListRecord {
  readonly id: number;
  readonly key: string | number;
  /** Counts up with every update by key; a change of it re-creates the box so that a screen reader reads it again. */
  readonly revision: number;
  readonly state: 'open' | 'closing';
  /** When the record was first opened (milliseconds since the epoch). An update keeps it. */
  readonly createdAt: number;
}

export interface ListSnapshot<Rec extends ListRecord, Settings> {
  readonly records: readonly Rec[];
  readonly settings: Settings;
  /** The id of the host that draws the records, or `undefined` when no host is mounted. */
  readonly activeHost: number | undefined;
}

export interface ListHostRegistration<Config> {
  readonly id: number;
  update(settings: Config): void;
  dispose(): void;
}

/** What `open` gives back: a way to close the record, and a promise that settles when it starts to close. */
export interface ListEntryRef {
  close(): void;
  readonly closed: Promise<void>;
}

export interface ListOpen<Rec extends ListRecord> {
  /** An open record with the same key is updated in place. Without one a key is made of the prefix and the id. */
  key?: string | number;
  /** Seconds, already checked by the component; `0` never closes. */
  duration: number;
  onclose?: (reason: CloseReason) => void;
  /** Makes the record from the fields the list owns. */
  build(base: ListRecord): Rec;
}

export interface ListStoreOptions<Config extends object, Settings extends { maxCount: number | undefined }> {
  /** The prefix of a generated key (`ads-message` gives `ads-message-3`). */
  keyPrefix: string;
  /** Settings that are objects: `setConfig` merges them one level deep with what was set before. */
  mergedKeys: readonly (keyof Config)[];
  /** The settings of the active host (`{}` with none) over the global ones, made into the component's settings. */
  resolve(host: Config, config: Config): Settings;
}

export interface ListStore<Rec extends ListRecord, Config extends object, Settings> {
  /** The current state. The same object until something changes. */
  getSnapshot(): ListSnapshot<Rec, Settings>;
  /** Calls `listener` after every change. Returns the function that stops it. */
  subscribe(listener: () => void): () => void;
  /** The settings as they are now. */
  settings(): Settings;
  /** Opens a record, or updates the open one with the same key. `undefined` on a server. */
  open(args: ListOpen<Rec>): ListEntryRef | undefined;
  /** Holds or releases the timer of a record for a reason. */
  setPaused(id: number, reason: PauseReason, on: boolean): void;
  /**
   * The timer of a record, read only: the milliseconds left and whether a reason holds it. `undefined` for an id that is not in the
   * list. A strip that shows the time left draws from it (specs/overlay.md, LS10).
   */
  timer(id: number): TimerState | undefined;
  /** Closes the open record with this id (the close button and Escape of a box use it). */
  closeById(id: number, reason?: CloseReason): void;
  /** Removes a closing record once its exit motion is over. A record that is still open is not touched. */
  finalize(id: number): void;
  /** Closes the open record with this key, or every open record. */
  destroy(key?: string | number): void;
  /** Sets defaults for every record. A value of `undefined` takes a setting back to its default. */
  setConfig(options: Config): void;
  /** Registers a host. The host registered last is the active one; another host draws nothing. */
  registerHost(settings: Config): ListHostRegistration<Config>;
  /** Forgets everything without calling `onclose`: the records, the timers, the settings and the hosts. For tests. */
  reset(): void;
}

interface Entry<Rec extends ListRecord> {
  record: Rec;
  onclose: ((reason: CloseReason) => void) | undefined;
  /** Closes the record when its duration is up; it stands still for the reasons in `PauseReason`. */
  timer: PausableTimer<PauseReason>;
  exitTimer: ReturnType<typeof setTimeout> | undefined;
  closed: Promise<void>;
  resolveClosed: () => void;
}

interface HostEntry<Config> {
  id: number;
  settings: Config;
}

/** No page to draw on: a server render. */
export const isServer = (): boolean => typeof document === 'undefined';

/** A duration in seconds: a finite number, 0 or more. */
export function validDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** A count: a finite number, 1 or more. */
export function validCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1;
}

/** The parts of an object setting (`classNames`, `styles`): the host's own over the global one, key by key. */
export function mergeParts<T extends object>(base: T | undefined, over: T | undefined): T {
  return { ...base, ...over } as T;
}

export function createListStore<Rec extends ListRecord, Config extends object, Settings extends { maxCount: number | undefined }>(
  options: ListStoreOptions<Config, Settings>
): ListStore<Rec, Config, Settings> {
  let entries: Entry<Rec>[] = [];
  let config = {} as Config;
  const hosts: HostEntry<Config>[] = [];
  const listeners = new Set<() => void>();
  let nextId = 0;
  let nextHostId = 0;
  let snapshot: ListSnapshot<Rec, Settings> | null = null;
  let watchingVisibility = false;

  const resolveNow = (): Settings => options.resolve(hosts.length > 0 ? hosts[hosts.length - 1].settings : ({} as Config), config);

  function notify(): void {
    snapshot = null;
    for (const listener of [...listeners]) listener();
  }

  function getSnapshot(): ListSnapshot<Rec, Settings> {
    snapshot ??= {
      records: entries.map((entry) => entry.record),
      settings: resolveNow(),
      activeHost: hosts.length > 0 ? hosts[hosts.length - 1].id : undefined
    };
    return snapshot;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  // ---- timers --------------------------------------------------------------------------------------------------------

  function setPaused(id: number, reason: PauseReason, on: boolean): void {
    entries.find((candidate) => candidate.record.id === id)?.timer.setPaused(reason, on);
  }

  function timerOf(id: number): TimerState | undefined {
    const entry = entries.find((candidate) => candidate.record.id === id);
    if (!entry) return undefined;
    return { remaining: entry.record.state === 'open' ? entry.timer.remaining : 0, paused: entry.timer.paused };
  }

  function onVisibility(): void {
    for (const entry of entries) entry.timer.setPaused('hidden', document.hidden);
  }

  function watchVisibility(on: boolean): void {
    if (on === watchingVisibility) return;
    watchingVisibility = on;
    if (on) document.addEventListener('visibilitychange', onVisibility);
    else document.removeEventListener('visibilitychange', onVisibility);
  }

  // ---- closing -------------------------------------------------------------------------------------------------------

  function closeEntry(entry: Entry<Rec>, reason: CloseReason): void {
    if (entry.record.state !== 'open') return;
    entry.timer.cancel();
    entry.record = { ...entry.record, state: 'closing' };
    // Nothing may keep a closing record on the page for good: if no host reports the end of its exit, this does.
    entry.exitTimer = setTimeout(() => finalize(entry.record.id), EXIT_FALLBACK);
    notify();
    entry.resolveClosed();
    entry.onclose?.(reason);
  }

  function closeById(id: number, reason: CloseReason = 'user'): void {
    const entry = entries.find((candidate) => candidate.record.id === id);
    if (entry) closeEntry(entry, reason);
  }

  function finalize(id: number): void {
    const entry = entries.find((candidate) => candidate.record.id === id);
    if (!entry || entry.record.state !== 'closing') return;
    clearTimeout(entry.exitTimer);
    entries = entries.filter((candidate) => candidate !== entry);
    if (entries.length === 0) watchVisibility(false);
    notify();
  }

  function enforceMaxCount(): void {
    const { maxCount } = resolveNow();
    if (maxCount === undefined) return;
    const open = entries.filter((entry) => entry.record.state === 'open');
    for (const entry of open.slice(0, Math.max(0, open.length - maxCount))) closeEntry(entry, 'replaced');
  }

  // ---- the calls -----------------------------------------------------------------------------------------------------

  const refFor = (entry: Entry<Rec>): ListEntryRef => ({ close: () => closeEntry(entry, 'destroy'), closed: entry.closed });

  function open(args: ListOpen<Rec>): ListEntryRef | undefined {
    if (isServer()) return undefined;

    const existing =
      args.key === undefined ? undefined : entries.find((entry) => entry.record.key === args.key && entry.record.state === 'open');

    const id = existing ? existing.record.id : ++nextId;
    const record = args.build({
      id,
      key: args.key ?? `${options.keyPrefix}-${id}`,
      revision: existing ? existing.record.revision + 1 : 0,
      state: 'open',
      createdAt: existing ? existing.record.createdAt : Date.now()
    });

    if (existing) {
      existing.record = record;
      existing.onclose = args.onclose;
      existing.timer.restart(args.duration * 1000);
      notify();
      return refFor(existing);
    }

    let resolveClosed!: () => void;
    const entry: Entry<Rec> = {
      record,
      onclose: args.onclose,
      timer: createPausableTimer<PauseReason>(args.duration * 1000, () => closeEntry(entry, 'timeout')),
      exitTimer: undefined,
      closed: new Promise<void>((resolve) => {
        resolveClosed = resolve;
      }),
      resolveClosed: () => resolveClosed()
    };
    if (document.hidden) entry.timer.setPaused('hidden', true);
    entries = [...entries, entry];
    watchVisibility(true);
    entry.timer.start();
    enforceMaxCount();
    notify();
    return refFor(entry);
  }

  function destroy(key?: string | number): void {
    for (const entry of [...entries]) {
      if (key === undefined || entry.record.key === key) closeEntry(entry, 'destroy');
    }
  }

  function setConfig(next: Config): void {
    const merged: Record<string, unknown> = { ...(config as Record<string, unknown>) };
    for (const name of Object.keys(next) as (keyof Config & string)[]) {
      const value = next[name];
      if (value === undefined) {
        delete merged[name];
      } else if (options.mergedKeys.includes(name)) {
        merged[name] = { ...(config[name] as object | undefined), ...(value as object) };
      } else {
        merged[name] = value;
      }
    }
    config = merged as Config;
    enforceMaxCount();
    notify();
  }

  // ---- hosts ---------------------------------------------------------------------------------------------------------

  function registerHost(settings: Config): ListHostRegistration<Config> {
    const host: HostEntry<Config> = { id: ++nextHostId, settings };
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

  function reset(): void {
    for (const entry of entries) {
      entry.timer.cancel();
      clearTimeout(entry.exitTimer);
    }
    entries = [];
    config = {} as Config;
    hosts.length = 0;
    watchVisibility(false);
    notify();
  }

  return { getSnapshot, subscribe, settings: resolveNow, open, setPaused, timer: timerOf, closeById, finalize, destroy, setConfig, registerHost, reset };
}
