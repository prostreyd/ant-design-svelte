// The list behind `notification` (specs/notification.md), called directly: what the components never reach on their own.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { removeLayer } from '../src/lib/Notification/layer';
import { notification } from '../src/lib/Notification/notification';
import { closeById, finalize, getSnapshot, resetNotifications, timeLeft } from '../src/lib/Notification/store';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  removeLayer();
  resetNotifications();
  document.body.innerHTML = '';
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('the store', () => {
  it('closeById closes the notification with that id, and an id that is not there is ignored', () => {
    notification.info({ title: 'x', duration: 0 });
    const [record] = getSnapshot().records;
    closeById(999);
    expect(getSnapshot().records[0].state).toBe('open');
    closeById(record.id);
    expect(getSnapshot().records[0].state).toBe('closing');
  });

  it('finalize removes a closing notification only: an open one and an unknown id stay as they are', () => {
    notification.info({ title: 'x', duration: 0 });
    const [record] = getSnapshot().records;
    finalize(999);
    finalize(record.id);
    expect(getSnapshot().records).toHaveLength(1);
    closeById(record.id);
    finalize(record.id);
    expect(getSnapshot().records).toHaveLength(0);
  });

  it('timeLeft is the time before the notification closes by itself, and 0 for one that is not in the list', () => {
    notification.info({ title: 'x', duration: 10 });
    const [record] = getSnapshot().records;
    vi.advanceTimersByTime(4000);
    expect(timeLeft(record.id)).toBe(6000);
    expect(timeLeft(999)).toBe(0);
  });

  it('a record keeps what the call gave it: the options, the key and the duration in seconds', () => {
    notification.warning({ title: 'T', description: 'D', key: 'k', duration: false, placement: 'bottom', showProgress: true });
    const [record] = getSnapshot().records;
    expect(record).toMatchObject({ type: 'warning', title: 'T', description: 'D', key: 'k', duration: 0, placement: 'bottom', showProgress: true, state: 'open' });
  });

  it('a production build does not warn about an invalid duration or place, and uses the defaults', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    notification.info({ title: 'a', duration: -1, placement: 'middle' as never });
    notification.config({ duration: -3, placement: 'middle' as never });
    notification.info({ title: 'b' });
    expect(warn).not.toHaveBeenCalled();
    const [a, b] = getSnapshot().records;
    expect(a.placement).toBe('topRight');
    expect(a.duration).toBe(4.5);
    expect(b.duration).toBe(4.5);
    expect(getSnapshot().settings.placement).toBe('topRight');
  });
});
