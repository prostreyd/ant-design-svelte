// The list of static dialogs, without any component (specs/modal.md, R15): the snapshot, the hosts, closing, updating, and a server.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureLayer, removeLayer } from '../src/lib/Modal/layer';
import { modal } from '../src/lib/Modal/modal';
import {
  closeEntry,
  destroyAll,
  finalize,
  getSnapshot,
  openModal,
  registerHost,
  resetModals,
  subscribe
} from '../src/lib/Modal/store';

beforeEach(() => {
  resetModals();
});

afterEach(() => {
  removeLayer();
  resetModals();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('the snapshot and the subscriptions', () => {
  it('is the same object until something changes, and a new one after', () => {
    const first = getSnapshot();
    expect(getSnapshot()).toBe(first);
    openModal({ title: 'T' }, 'info');
    const second = getSnapshot();
    expect(second).not.toBe(first);
    expect(second.records).toHaveLength(1);
    expect(second.records[0]).toMatchObject({ kind: 'info', open: true, options: { title: 'T' } });
  });

  it('a listener hears every change, and not after it is removed', () => {
    const listener = vi.fn();
    const stop = subscribe(listener);
    const handle = openModal({}, 'info');
    handle.update({ title: 'x' });
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    handle.update({ title: 'y' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('the options are copied when the dialog opens', () => {
    const options = { title: 'Original' };
    openModal(options, 'info');
    options.title = 'Changed';
    expect(getSnapshot().records[0].options.title).toBe('Original');
  });
});

describe('closing and taking out', () => {
  it('closeEntry marks the record closed and resolves the handle once, with the first answer', async () => {
    const handle = openModal({}, 'confirm');
    const { id } = getSnapshot().records[0];
    closeEntry(id, true);
    closeEntry(id, false);
    expect(getSnapshot().records[0].open).toBe(false);
    await expect(handle).resolves.toBe(true);
  });

  it('closeEntry of an unknown dialog does nothing, and does not tell the listeners', () => {
    const listener = vi.fn();
    subscribe(listener);
    closeEntry(999, true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('finalize takes the record out, and an unknown one does nothing', () => {
    openModal({}, 'info');
    const { id } = getSnapshot().records[0];
    const listener = vi.fn();
    subscribe(listener);
    finalize(999);
    expect(listener).not.toHaveBeenCalled();
    finalize(id);
    expect(getSnapshot().records).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('destroy resolves false and does nothing the second time; update after it does nothing', async () => {
    const handle = openModal({ title: 'T' }, 'info');
    handle.destroy();
    handle.destroy();
    handle.update({ title: 'late' });
    expect(getSnapshot().records[0].options.title).toBe('T');
    await expect(handle).resolves.toBe(false);
  });

  it('destroyAll closes every dialog that is open, and with none it does nothing', async () => {
    destroyAll();
    const first = openModal({}, 'info');
    const second = openModal({}, 'error');
    destroyAll();
    await expect(Promise.all([first, second])).resolves.toEqual([false, false]);
    expect(getSnapshot().records.every((record) => !record.open)).toBe(true);
  });

  it('update merges an object, calls a function with the previous options, and ignores an unknown dialog', () => {
    const handle = openModal({ title: 'A', content: 'B' }, 'info');
    handle.update({ title: 'C' });
    expect(getSnapshot().records[0].options).toEqual({ title: 'C', content: 'B' });
    handle.update((previous) => ({ content: `${previous.content as string}!` }));
    expect(getSnapshot().records[0].options).toEqual({ title: 'C', content: 'B!' });
    resetModals();
    expect(() => handle.update({ title: 'gone' })).not.toThrow();
  });
});

describe('the hosts', () => {
  it('the host mounted last is the active one, and the one before it is back when it goes', () => {
    expect(getSnapshot().activeHost).toBeUndefined();
    const first = registerHost();
    const second = registerHost();
    expect(getSnapshot().activeHost).toBe(second.id);
    second.dispose();
    expect(getSnapshot().activeHost).toBe(first.id);
    first.dispose();
    expect(getSnapshot().activeHost).toBeUndefined();
  });

  it('a host that is disposed twice does no harm', () => {
    const first = registerHost();
    const second = registerHost();
    second.dispose();
    second.dispose();
    expect(getSnapshot().activeHost).toBe(first.id);
  });
});

describe('on a server', () => {
  it('a call makes no state and no layer, and the handle can be used and awaited', async () => {
    vi.stubGlobal('document', undefined);
    const handle = modal.confirm({ title: 'T' });
    expect(() => handle.destroy()).not.toThrow();
    expect(() => handle.update({ title: 'x' })).not.toThrow();
    await expect(handle).resolves.toBe(false);
    expect(await handle.then(undefined, () => 'no')).toBe(false);
    expect(() => ensureLayer()).not.toThrow();
    vi.unstubAllGlobals();
    expect(getSnapshot().records).toHaveLength(0);
    expect(document.querySelector('.ads-modal-root')).toBeNull();
  });
});
