// The words Orca adds around what a screen reader test asserts (screen-reader/spoken.ts). The Orca tests themselves run only on GitHub
// (and in Docker), so what they filter is checked here, with the phrases they once got.
import { describe, expect, it } from 'vitest';
import { cleanSpoken } from '../screen-reader/spoken';

describe('screen reader tests: cleanSpoken', () => {
  it('a landmark that Orca says first is removed: the phrase that failed the Radio test on GitHub (attempt 1) is the control alone', () => {
    expect(cleanSpoken('main content. Newsletter. not selected radio button')).toBe('Newsletter. not selected radio button');
  });

  it('the phrase without the landmark (the retry of the same commit) is the same', () => {
    expect(cleanSpoken('Newsletter. not selected radio button')).toBe('Newsletter. not selected radio button');
  });

  it('the "tab." of a key press is removed everywhere, before the landmark too', () => {
    expect(cleanSpoken('tab. main content. tab. Fruit. panel. Pear. selected radio button')).toBe('Fruit. panel. Pear. selected radio button');
  });

  it('the words of a landmark inside a phrase stay: only a leading one is removed', () => {
    expect(cleanSpoken('leaving panel.. main content. Size')).toBe('leaving panel.. main content. Size');
  });

  it('the name of another landmark is not touched', () => {
    expect(cleanSpoken('navigation. Menu')).toBe('navigation. Menu');
  });
});
