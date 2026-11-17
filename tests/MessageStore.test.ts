// The list behind `message` (specs/message.md), called directly: what the components never reach on their own.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { removeLayer } from '../src/lib/Message/layer';
import { message } from '../src/lib/Message/message';
import { closeById, finalize, getSnapshot, registerHost, resetMessages } from '../src/lib/Message/store';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  removeLayer();
  resetMessages();
  document.body.innerHTML = '';
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('the store', () => {
  it('closeById closes the message with that id, and an id that is not there is ignored', () => {
    message.info('x', 0);
    const [record] = getSnapshot().records;
    closeById(999);
    expect(getSnapshot().records[0].state).toBe('open');
    closeById(record.id);
    expect(getSnapshot().records[0].state).toBe('closing');
  });

  it('finalize removes a closing message only: an open one and an unknown id stay as they are', () => {
    message.info('x', 0);
    const [record] = getSnapshot().records;
    finalize(999);
    finalize(record.id);
    expect(getSnapshot().records).toHaveLength(1);
    closeById(record.id);
    finalize(record.id);
    expect(getSnapshot().records).toHaveLength(0);
  });

  it('a message that nobody finalizes is removed after the fallback time', () => {
    message.info('x', 0);
    closeById(getSnapshot().records[0].id);
    vi.advanceTimersByTime(799);
    expect(getSnapshot().records).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(getSnapshot().records).toHaveLength(0);
  });

  it('the snapshot is the same object until something changes', () => {
    expect(getSnapshot()).toBe(getSnapshot());
    const before = getSnapshot();
    message.info('x', 0);
    expect(getSnapshot()).not.toBe(before);
  });

  it('a host that is disposed twice leaves the others alone', () => {
    const first = registerHost({});
    const second = registerHost({});
    expect(getSnapshot().activeHost).toBe(second.id);
    second.dispose();
    second.dispose();
    expect(getSnapshot().activeHost).toBe(first.id);
    first.dispose();
    expect(getSnapshot().activeHost).toBeUndefined();
  });

  it('the host mounted last wins, and its settings win over config()', () => {
    message.config({ top: 1, duration: 9 });
    const first = registerHost({ top: 2 });
    const second = registerHost({ top: 3 });
    expect(getSnapshot().settings.top).toBe(3);
    expect(getSnapshot().settings.duration).toBe(9);
    second.dispose();
    expect(getSnapshot().settings.top).toBe(2);
    first.dispose();
    expect(getSnapshot().settings.top).toBe(1);
  });

  it('a production build does not warn about an invalid duration, and uses the default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    message.info('x', -1);
    expect(warn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(getSnapshot().records[0].state).toBe('closing');
  });

  it('resetMessages forgets messages that are closing as well', () => {
    message.info('x', 0);
    closeById(getSnapshot().records[0].id);
    resetMessages();
    expect(getSnapshot().records).toHaveLength(0);
    vi.advanceTimersByTime(2000);
    expect(getSnapshot().records).toHaveLength(0);
  });
});
