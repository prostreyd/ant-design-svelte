// The core of the global list (specs/overlay.md, `list/`, LS1 to LS9), with a toy record: it must not depend on Message.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXIT_FALLBACK,
  createListStore,
  isServer,
  mergeParts,
  validCount,
  validDuration,
  type CloseReason,
  type ListEntryRef,
  type ListOpen,
  type ListRecord
} from '../src/lib/internal/list/listStore';

interface Toy extends ListRecord {
  text: string;
}
interface ToyConfig {
  maxCount?: number;
  label?: string;
  parts?: { a?: string; b?: string };
  other?: { x?: number };
}
interface ToySettings {
  maxCount: number | undefined;
  label: string;
  parts: { a?: string; b?: string };
  other: { x?: number } | undefined;
}

function makeStore() {
  return createListStore<Toy, ToyConfig, ToySettings>({
    keyPrefix: 'toy',
    mergedKeys: ['parts'],
    resolve: (host, config) => ({
      maxCount: host.maxCount ?? config.maxCount,
      label: host.label ?? config.label ?? 'default',
      parts: mergeParts(config.parts, host.parts),
      other: host.other ?? config.other
    })
  });
}
type Store = ReturnType<typeof makeStore>;

const stores: Store[] = [];
function fresh(): Store {
  const store = makeStore();
  stores.push(store);
  return store;
}

/** Opens a record that never closes by itself, unless the test gives a duration. */
function put(store: Store, text: string, extra: Partial<Omit<ListOpen<Toy>, 'build'>> = {}): ListEntryRef {
  const ref = store.open({ duration: 0, ...extra, build: (base) => ({ ...base, text }) });
  if (!ref) throw new Error('no page');
  return ref;
}

const records = (store: Store) => store.getSnapshot().records;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-19T10:00:00Z'));
});

afterEach(() => {
  for (const store of stores.splice(0)) store.reset();
  delete (document as { hidden?: boolean }).hidden;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function hidePage(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('LS1: open and update by key', () => {
  it('adds an open record with the fields the list owns and the ones the component builds', () => {
    const store = fresh();
    const build = vi.fn((base: ListRecord) => ({ ...base, text: 'hello' }));
    store.open({ duration: 0, build });
    const [record] = records(store);
    expect(build).toHaveBeenCalledWith({
      id: 1,
      key: 'toy-1',
      revision: 0,
      state: 'open',
      createdAt: new Date('2026-11-19T10:00:00Z').getTime()
    });
    expect(record).toMatchObject({ id: 1, key: 'toy-1', revision: 0, state: 'open', text: 'hello' });
  });

  it('numbers the records one after the other, and keeps a key that is given', () => {
    const store = fresh();
    put(store, 'a');
    put(store, 'b', { key: 'mine' });
    put(store, 'c', { key: 7 });
    expect(records(store).map((r) => [r.id, r.key])).toEqual([
      [1, 'toy-1'],
      [2, 'mine'],
      [3, 7]
    ]);
  });

  it('the same key of an open record updates it in place: same id and createdAt, revision up, one record', () => {
    const store = fresh();
    put(store, 'one', { key: 'k' });
    const [before] = records(store);
    vi.setSystemTime(new Date('2026-11-19T10:00:05Z'));
    put(store, 'two', { key: 'k' });
    const all = records(store);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ id: before.id, createdAt: before.createdAt, revision: 1, text: 'two', state: 'open' });
    put(store, 'three', { key: 'k' });
    expect(records(store)[0].revision).toBe(2);
  });

  it('an update replaces `onclose`: the old one is never called', () => {
    const store = fresh();
    const first = vi.fn();
    const second = vi.fn();
    put(store, 'one', { key: 'k', onclose: first });
    put(store, 'two', { key: 'k', onclose: second });
    store.closeById(records(store)[0].id);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('an update restarts the timer in full', () => {
    const store = fresh();
    const onclose = vi.fn();
    put(store, 'one', { key: 'k', duration: 1, onclose });
    vi.advanceTimersByTime(800);
    put(store, 'two', { key: 'k', duration: 1, onclose });
    vi.advanceTimersByTime(800);
    expect(records(store)[0].state).toBe('open');
    vi.advanceTimersByTime(200);
    expect(records(store)[0].state).toBe('closing');
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('an update takes the new duration, also a longer one and "never"', () => {
    const store = fresh();
    put(store, 'one', { key: 'k', duration: 1 });
    put(store, 'two', { key: 'k', duration: 0 });
    vi.advanceTimersByTime(60_000);
    expect(records(store)[0].state).toBe('open');
  });

  it('an update keeps the pauses that hold', () => {
    const store = fresh();
    put(store, 'one', { key: 'k', duration: 1 });
    const { id } = records(store)[0];
    store.setPaused(id, 'hover', true);
    put(store, 'two', { key: 'k', duration: 1 });
    vi.advanceTimersByTime(5000);
    expect(records(store)[0].state).toBe('open');
    store.setPaused(id, 'hover', false);
    vi.advanceTimersByTime(1000);
    expect(records(store)[0].state).toBe('closing');
  });

  it('the same key after the record began to close opens a new record', () => {
    const store = fresh();
    put(store, 'one', { key: 'k' });
    store.closeById(records(store)[0].id);
    put(store, 'two', { key: 'k' });
    const all = records(store);
    expect(all).toHaveLength(2);
    expect(all.map((r) => [r.text, r.state])).toEqual([
      ['one', 'closing'],
      ['two', 'open']
    ]);
    expect(all[1].id).not.toBe(all[0].id);
  });

  it('returns a handle: close() closes it, `closed` settles when it starts to close, not after the exit', async () => {
    const store = fresh();
    const ref = put(store, 'x');
    let settled = false;
    void ref.closed.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    ref.close();
    await ref.closed;
    expect(settled).toBe(true);
    expect(records(store)[0].state).toBe('closing');
  });

  it('on a server (no document) it stores nothing and returns nothing', () => {
    const store = fresh();
    vi.stubGlobal('document', undefined);
    expect(isServer()).toBe(true);
    expect(store.open({ duration: 0, build: (base) => ({ ...base, text: 'x' }) })).toBeUndefined();
    expect(records(store)).toEqual([]);
    vi.unstubAllGlobals();
    expect(isServer()).toBe(false);
  });
});

describe('LS2: close, with a reason', () => {
  const reasons = (store: Store, close: (store: Store, id: number) => void, duration = 0): CloseReason[] => {
    const seen: CloseReason[] = [];
    put(store, 'x', { duration, onclose: (reason) => seen.push(reason) });
    close(store, records(store)[0].id);
    return seen;
  };

  it('`timeout` when its time runs out', () => {
    const store = fresh();
    expect(reasons(store, () => vi.advanceTimersByTime(1000), 1)).toEqual(['timeout']);
  });

  it('`user` for closeById, by default', () => {
    const store = fresh();
    expect(reasons(store, (s, id) => s.closeById(id))).toEqual(['user']);
  });

  it('closeById can name another reason', () => {
    const store = fresh();
    expect(reasons(store, (s, id) => s.closeById(id, 'destroy'))).toEqual(['destroy']);
  });

  it('`destroy` for the `close` of the handle and for destroy()', () => {
    const store = fresh();
    const seen: CloseReason[] = [];
    put(store, 'a', { onclose: (reason) => seen.push(reason) }).close();
    put(store, 'b', { key: 'b', onclose: (reason) => seen.push(reason) });
    store.destroy();
    expect(seen).toEqual(['destroy', 'destroy']);
  });

  it('`replaced` for the limit', () => {
    const store = fresh();
    store.setConfig({ maxCount: 1 });
    const seen: CloseReason[] = [];
    put(store, 'a', { onclose: (reason) => seen.push(reason) });
    put(store, 'b');
    expect(seen).toEqual(['replaced']);
  });

  it('the state is closing and the listeners are told before `onclose` runs; `closed` has settled by then', async () => {
    const store = fresh();
    const order: string[] = [];
    store.subscribe(() => order.push(`listener:${records(store)[0]?.state}`));
    const ref = put(store, 'x', { onclose: () => order.push(`onclose:${records(store)[0].state}`) });
    order.length = 0;
    void ref.closed.then(() => order.push('closed'));
    ref.close();
    await Promise.resolve();
    expect(order).toEqual(['listener:closing', 'onclose:closing', 'closed']);
  });

  it('a record closes once, whatever closes it first and whatever comes after', () => {
    const store = fresh();
    const seen: CloseReason[] = [];
    const ref = put(store, 'x', { duration: 1, onclose: (reason) => seen.push(reason) });
    const { id } = records(store)[0];
    store.closeById(id);
    store.closeById(id);
    ref.close();
    store.destroy();
    store.setConfig({ maxCount: 1 });
    vi.advanceTimersByTime(60_000 - EXIT_FALLBACK);
    expect(seen).toEqual(['user']);
  });

  it('closeById with an id that is not there does nothing', () => {
    const store = fresh();
    put(store, 'x');
    store.closeById(999);
    expect(records(store)[0].state).toBe('open');
  });

  it('finalize removes a closing record only: an open one and an unknown id stay as they are', () => {
    const store = fresh();
    put(store, 'x');
    const { id } = records(store)[0];
    store.finalize(999);
    store.finalize(id);
    expect(records(store)).toHaveLength(1);
    store.closeById(id);
    store.finalize(id);
    expect(records(store)).toHaveLength(0);
  });

  it('a record that nobody finalizes is removed after the fallback time, not before', () => {
    const store = fresh();
    put(store, 'x');
    store.closeById(records(store)[0].id);
    vi.advanceTimersByTime(799);
    expect(records(store)).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(records(store)).toHaveLength(0);
  });

  it('the fallback time is 800 ms (the spec), and finalize takes the fallback timer away', () => {
    expect(EXIT_FALLBACK).toBe(800);
    const store = fresh();
    put(store, 'x');
    const { id } = records(store)[0];
    store.closeById(id);
    expect(vi.getTimerCount()).toBe(1);
    store.finalize(id);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a record that was finalized does not tell the listeners again when its fallback time comes', () => {
    const store = fresh();
    put(store, 'x');
    const { id } = records(store)[0];
    store.closeById(id);
    store.finalize(id);
    const listener = vi.fn();
    store.subscribe(listener);
    vi.advanceTimersByTime(EXIT_FALLBACK * 2);
    expect(listener).not.toHaveBeenCalled();
  });

  it('a closed record is no longer found by closeById or setPaused', () => {
    const store = fresh();
    put(store, 'x');
    const { id } = records(store)[0];
    store.closeById(id);
    store.finalize(id);
    expect(() => {
      store.closeById(id);
      store.setPaused(id, 'hover', true);
    }).not.toThrow();
  });
});

describe('LS3: the limit', () => {
  it('a new record above the limit closes the oldest open one first', () => {
    const store = fresh();
    store.setConfig({ maxCount: 2 });
    put(store, 'a');
    put(store, 'b');
    put(store, 'c');
    expect(records(store).map((r) => [r.text, r.state])).toEqual([
      ['a', 'closing'],
      ['b', 'open'],
      ['c', 'open']
    ]);
    put(store, 'd');
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'closing', 'open', 'open']);
  });

  it('closing records do not count against the limit', () => {
    const store = fresh();
    store.setConfig({ maxCount: 1 });
    put(store, 'a');
    store.closeById(records(store)[0].id, 'user');
    put(store, 'b');
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'open']);
  });

  it('a closing record that is newer than an open one does not push the open one out', () => {
    const store = fresh();
    put(store, 'a');
    put(store, 'b');
    store.closeById(records(store)[1].id);
    store.setConfig({ maxCount: 1 });
    expect(records(store).map((r) => [r.text, r.state])).toEqual([
      ['a', 'open'],
      ['b', 'closing']
    ]);
  });

  it('is looked at when the settings change', () => {
    const store = fresh();
    put(store, 'a');
    put(store, 'b');
    put(store, 'c');
    store.setConfig({ maxCount: 1 });
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'closing', 'open']);
  });

  it('is looked at when a host registers, and when its settings change', () => {
    const store = fresh();
    put(store, 'a');
    put(store, 'b');
    const host = store.registerHost({ maxCount: 1 });
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'open']);
    host.dispose();

    const other = fresh();
    put(other, 'a');
    put(other, 'b');
    const second = other.registerHost({});
    expect(records(other).map((r) => r.state)).toEqual(['open', 'open']);
    second.update({ maxCount: 1 });
    expect(records(other).map((r) => r.state)).toEqual(['closing', 'open']);
  });

  it('no limit when none is set', () => {
    const store = fresh();
    for (let i = 0; i < 20; i++) put(store, String(i));
    expect(records(store).every((r) => r.state === 'open')).toBe(true);
  });
});

describe('LS4: pause', () => {
  it('a pause keeps the time left and resumes with it', () => {
    const store = fresh();
    put(store, 'x', { duration: 1 });
    const { id } = records(store)[0];
    vi.advanceTimersByTime(400);
    store.setPaused(id, 'hover', true);
    vi.advanceTimersByTime(5000);
    expect(records(store)[0].state).toBe('open');
    store.setPaused(id, 'hover', false);
    vi.advanceTimersByTime(599);
    expect(records(store)[0].state).toBe('open');
    vi.advanceTimersByTime(1);
    expect(records(store)[0].state).toBe('closing');
  });

  it('every reason holds on its own', () => {
    const store = fresh();
    put(store, 'x', { duration: 1 });
    const { id } = records(store)[0];
    store.setPaused(id, 'focus', true);
    store.setPaused(id, 'pile', true);
    store.setPaused(id, 'focus', false);
    vi.advanceTimersByTime(5000);
    expect(records(store)[0].state).toBe('open');
    store.setPaused(id, 'pile', false);
    vi.advanceTimersByTime(1000);
    expect(records(store)[0].state).toBe('closing');
  });

  it('an unknown id is ignored', () => {
    const store = fresh();
    expect(() => store.setPaused(42, 'hover', true)).not.toThrow();
  });

  it('a hidden page holds every timer, and releases them with the time left', () => {
    const store = fresh();
    put(store, 'a', { duration: 1 });
    put(store, 'b', { duration: 2 });
    vi.advanceTimersByTime(500);
    hidePage(true);
    vi.advanceTimersByTime(10_000);
    expect(records(store).map((r) => r.state)).toEqual(['open', 'open']);
    hidePage(false);
    vi.advanceTimersByTime(500);
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'open']);
    vi.advanceTimersByTime(1000);
    // `a` was closing for longer than the fallback time, so it is gone; `b` has just begun to close.
    expect(records(store).map((r) => [r.text, r.state])).toEqual([['b', 'closing']]);
  });

  it('a record opened while the page is hidden starts held', () => {
    const store = fresh();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    put(store, 'x', { duration: 1 });
    vi.advanceTimersByTime(10_000);
    expect(records(store)[0].state).toBe('open');
    hidePage(false);
    vi.advanceTimersByTime(1000);
    expect(records(store)[0].state).toBe('closing');
  });

  it('listens to the page once for any number of records, and stops with the last one', () => {
    const store = fresh();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const visibility = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === 'visibilitychange').length;
    put(store, 'a');
    put(store, 'b');
    expect(visibility(add)).toBe(1);
    expect(visibility(remove)).toBe(0);
    store.closeById(records(store)[0].id);
    store.finalize(records(store)[0].id);
    expect(visibility(remove)).toBe(0);
    store.closeById(records(store)[0].id);
    store.finalize(records(store)[0].id);
    expect(visibility(remove)).toBe(1);
  });

  it('reset stops listening to the page', () => {
    const store = fresh();
    const remove = vi.spyOn(document, 'removeEventListener');
    put(store, 'a');
    store.reset();
    expect(remove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
  });
});

describe('LS5: settings', () => {
  it('the defaults come from the component', () => {
    const store = fresh();
    expect(store.getSnapshot().settings).toEqual({ maxCount: undefined, label: 'default', parts: {}, other: undefined });
    expect(store.settings()).toEqual(store.getSnapshot().settings);
  });

  it('setConfig replaces plain settings and merges the named objects one level deep', () => {
    const store = fresh();
    store.setConfig({ label: 'one', parts: { a: 'a1' }, other: { x: 1 } });
    store.setConfig({ parts: { b: 'b2' }, other: { x: 2 } });
    expect(store.settings()).toMatchObject({ label: 'one', parts: { a: 'a1', b: 'b2' }, other: { x: 2 } });
  });

  it('a value of undefined takes a setting back to its default', () => {
    const store = fresh();
    store.setConfig({ label: 'one', parts: { a: 'a' } });
    store.setConfig({ label: undefined, parts: undefined });
    expect(store.settings()).toMatchObject({ label: 'default', parts: {} });
  });

  it('a setting that is not in the call is left as it was', () => {
    const store = fresh();
    store.setConfig({ label: 'one' });
    store.setConfig({ maxCount: 5 });
    expect(store.settings()).toMatchObject({ label: 'one', maxCount: 5 });
  });

  it('the settings of the active host win over the global ones, until it is gone', () => {
    const store = fresh();
    store.setConfig({ label: 'global', parts: { a: 'g', b: 'g' } });
    const host = store.registerHost({ label: 'host', parts: { a: 'h' } });
    expect(store.settings()).toMatchObject({ label: 'host', parts: { a: 'h', b: 'g' } });
    host.dispose();
    expect(store.settings()).toMatchObject({ label: 'global', parts: { a: 'g', b: 'g' } });
  });

  it('setConfig tells the listeners', () => {
    const store = fresh();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setConfig({ label: 'x' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('LS6: hosts', () => {
  it('there is no active host until one registers; the one registered last is the active one', () => {
    const store = fresh();
    expect(store.getSnapshot().activeHost).toBeUndefined();
    const first = store.registerHost({});
    const second = store.registerHost({});
    expect(first.id).not.toBe(second.id);
    expect(store.getSnapshot().activeHost).toBe(second.id);
    second.dispose();
    expect(store.getSnapshot().activeHost).toBe(first.id);
    first.dispose();
    expect(store.getSnapshot().activeHost).toBeUndefined();
  });

  it('with two hosts, the settings are the ones of the host registered last', () => {
    const store = fresh();
    store.registerHost({ label: 'first' });
    store.registerHost({ label: 'second' });
    expect(store.settings().label).toBe('second');
  });

  it('a host that is disposed twice leaves the others alone', () => {
    const store = fresh();
    const first = store.registerHost({ label: 'first' });
    const second = store.registerHost({ label: 'second' });
    second.dispose();
    second.dispose();
    expect(store.getSnapshot().activeHost).toBe(first.id);
    expect(store.settings().label).toBe('first');
  });

  it('update changes the settings the host stands for, and tells the listeners', () => {
    const store = fresh();
    const host = store.registerHost({ label: 'before' });
    const listener = vi.fn();
    store.subscribe(listener);
    host.update({ label: 'after' });
    expect(store.settings().label).toBe('after');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('LS7: snapshot and listeners', () => {
  it('the snapshot is the same object until something changes', () => {
    const store = fresh();
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    const before = store.getSnapshot();
    put(store, 'x');
    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('a record is a new object for every change, so a comparison by identity is enough', () => {
    const store = fresh();
    put(store, 'x', { key: 'k' });
    const [before] = records(store);
    put(store, 'y', { key: 'k' });
    expect(records(store)[0]).not.toBe(before);
    const [open] = records(store);
    store.closeById(open.id);
    expect(records(store)[0]).not.toBe(open);
  });

  it('every change calls each listener once; a stopped listener is not called', () => {
    const store = fresh();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    const stop = store.subscribe(b);
    put(store, 'x');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    stop();
    put(store, 'y');
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('a listener that stops itself does not make the next one miss the call', () => {
    const store = fresh();
    const next = vi.fn();
    const stop = store.subscribe(() => stop());
    store.subscribe(next);
    put(store, 'x');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('two lists do not see each other: records, ids, settings, hosts', () => {
    const one = fresh();
    const two = fresh();
    put(one, 'in one');
    one.setConfig({ label: 'one' });
    one.registerHost({});
    expect(records(two)).toEqual([]);
    expect(two.settings().label).toBe('default');
    expect(two.getSnapshot().activeHost).toBeUndefined();
    put(two, 'in two');
    expect(records(two)[0].id).toBe(1);
    one.reset();
    expect(records(two)).toHaveLength(1);
  });
});

describe('LS8: destroy and reset', () => {
  it('destroy(key) closes that record only; destroy() closes every open record', () => {
    const store = fresh();
    put(store, 'a', { key: 'a' });
    put(store, 'b', { key: 'b' });
    store.destroy('a');
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'open']);
    store.destroy('nope');
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'open']);
    store.destroy();
    expect(records(store).map((r) => r.state)).toEqual(['closing', 'closing']);
  });

  it('destroy does not close a record twice', () => {
    const store = fresh();
    const onclose = vi.fn();
    put(store, 'a', { onclose });
    store.destroy();
    store.destroy();
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('reset forgets the records, the timers, the settings and the hosts without calling `onclose`', () => {
    const store = fresh();
    const onclose = vi.fn();
    put(store, 'a', { duration: 1, onclose });
    put(store, 'b', { onclose });
    store.closeById(records(store)[1].id);
    store.setConfig({ label: 'x' });
    store.registerHost({ label: 'host' });
    const listener = vi.fn();
    store.subscribe(listener);
    onclose.mockClear();

    store.reset();
    expect(records(store)).toEqual([]);
    expect(store.settings().label).toBe('default');
    expect(store.getSnapshot().activeHost).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(onclose).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('LS9: helpers', () => {
  it('validDuration: a finite number, 0 or more', () => {
    for (const ok of [0, 1, 4.5]) expect(validDuration(ok)).toBe(true);
    for (const bad of [-1, NaN, Infinity, '1', null, undefined]) expect(validDuration(bad)).toBe(false);
  });

  it('validCount: a finite number, 1 or more', () => {
    for (const ok of [1, 2, 3.5]) expect(validCount(ok)).toBe(true);
    for (const bad of [0, 0.5, -1, NaN, Infinity, '2', null, undefined]) expect(validCount(bad)).toBe(false);
  });

  it('mergeParts: the second over the first, key by key; nothing gives an empty object', () => {
    expect(mergeParts({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
    expect(mergeParts(undefined, { b: 3 })).toEqual({ b: 3 });
    expect(mergeParts({ a: 1 }, undefined)).toEqual({ a: 1 });
    expect(mergeParts(undefined, undefined)).toEqual({});
    const base = { a: 1 };
    mergeParts(base, { a: 2 });
    expect(base).toEqual({ a: 1 });
  });
});
