import { vi } from 'vitest';

/**
 * A `window.matchMedia` for jsdom, which has none. It understands the two forms the grid uses, `(min-width: Npx)` and
 * `not all and (min-width: Npx)`, and answers for a window `width` px wide. `setWidth` changes the width and fires the
 * `change` event of every query whose answer changed, as a browser does.
 */
export function installMatchMedia(initialWidth: number) {
  let width = initialWidth;
  type Entry = { query: string; list: MediaQueryList; listeners: Set<() => void>; last: boolean };
  const entries: Entry[] = [];

  const answer = (query: string): boolean => {
    const match = /(not all and )?\(min-width: (\d+(?:\.\d+)?)px\)/.exec(query);
    if (!match) throw new Error(`The test matchMedia does not understand "${query}".`);
    const wide = width >= Number(match[2]);
    return match[1] ? !wide : wide;
  };

  const matchMedia = vi.fn((query: string) => {
    const listeners = new Set<() => void>();
    const entry: Entry = { query, listeners, last: answer(query), list: undefined as unknown as MediaQueryList };
    entry.list = {
      media: query,
      get matches() {
        return answer(query);
      },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener)
    } as unknown as MediaQueryList;
    entries.push(entry);
    return entry.list;
  });
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

  return {
    matchMedia,
    /** The number of `change` listeners that are attached now, over all queries. */
    listenerCount: () => entries.reduce((sum, entry) => sum + entry.listeners.size, 0),
    setWidth(next: number) {
      width = next;
      for (const entry of entries) {
        const now = answer(entry.query);
        if (now !== entry.last) {
          entry.last = now;
          for (const listener of [...entry.listeners]) listener();
        }
      }
    },
    uninstall() {
      delete (window as { matchMedia?: unknown }).matchMedia;
    }
  };
}
