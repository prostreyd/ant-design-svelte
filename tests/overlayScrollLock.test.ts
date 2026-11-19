// The scroll lock (specs/overlay.md, O1). jsdom has no layout: the width of the scrollbar is a stub.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lockScroll } from '../src/lib/internal/overlay/scrollLock';

/** A page whose vertical scrollbar is `bar` px wide: the window is that much wider than the part the page uses. */
function pageWithScrollbar(bar: number): void {
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024 - bar, configurable: true });
}

beforeEach(() => {
  pageWithScrollbar(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('style');
  document.body.removeAttribute('style');
  document.body.innerHTML = '';
  delete (document.documentElement as unknown as { clientWidth?: number }).clientWidth;
});

const style = (name: string, element: HTMLElement = document.body) => element.style.getPropertyValue(name);

describe('lockScroll (O1)', () => {
  it('stops the body from scrolling, and puts back an empty value when it had none', () => {
    const unlock = lockScroll();
    expect(style('overflow')).toBe('hidden');
    unlock();
    expect(style('overflow')).toBe('');
    expect(document.body.getAttribute('style') ?? '').toBe('');
  });

  it('locks the page element as well: a page that scrolls on html is not held by the body alone', () => {
    const unlock = lockScroll();
    expect(style('overflow', document.documentElement)).toBe('hidden');
    unlock();
    expect(style('overflow', document.documentElement)).toBe('');
  });

  it('puts back the overflow that html had, and does not give it padding', () => {
    pageWithScrollbar(15);
    document.documentElement.style.setProperty('overflow-y', 'scroll');
    const unlock = lockScroll();
    expect(style('overflow-y', document.documentElement)).toBe('hidden');
    expect(style('padding-inline-end', document.documentElement)).toBe('');
    unlock();
    expect(style('overflow-y', document.documentElement)).toBe('scroll');
  });

  it('an element container leaves html alone', () => {
    const box = document.createElement('div');
    document.body.append(box);
    const unlock = lockScroll(box);
    expect(style('overflow', document.documentElement)).toBe('');
    unlock();
  });

  it('adds the width of the scrollbar to the end padding, and takes it away again', () => {
    pageWithScrollbar(15);
    const unlock = lockScroll();
    expect(style('padding-inline-end')).toBe('15px');
    unlock();
    expect(style('padding-inline-end')).toBe('');
  });

  it('adds to the padding the body already has', () => {
    pageWithScrollbar(15);
    document.body.style.setProperty('padding-inline-end', '8px');
    const unlock = lockScroll();
    expect(style('padding-inline-end')).toBe('23px');
    unlock();
    expect(style('padding-inline-end')).toBe('8px');
  });

  it('a page with no scrollbar gets no padding', () => {
    const unlock = lockScroll();
    expect(style('padding-inline-end')).toBe('');
    unlock();
  });

  it('puts back exactly the inline values it found', () => {
    document.body.style.setProperty('overflow-x', 'auto');
    document.body.style.setProperty('overflow-y', 'scroll');
    const unlock = lockScroll();
    expect(style('overflow-x')).toBe('hidden');
    unlock();
    expect(style('overflow-x')).toBe('auto');
    expect(style('overflow-y')).toBe('scroll');
  });

  it('two layers lock once, and the last one to be released puts it back', () => {
    pageWithScrollbar(15);
    document.body.style.setProperty('padding-inline-end', '8px');
    const first = lockScroll();
    const second = lockScroll();
    // The second hold must not measure the body again: the padding is already the locked one.
    expect(style('padding-inline-end')).toBe('23px');
    first();
    expect(style('overflow')).toBe('hidden');
    expect(style('padding-inline-end')).toBe('23px');
    second();
    expect(style('overflow')).toBe('');
    expect(style('padding-inline-end')).toBe('8px');
  });

  it('the holds are let go in any order', () => {
    const first = lockScroll();
    const second = lockScroll();
    second();
    expect(style('overflow')).toBe('hidden');
    first();
    expect(style('overflow')).toBe('');
  });

  it('letting go twice releases only one hold', () => {
    const first = lockScroll();
    const second = lockScroll();
    first();
    first();
    expect(style('overflow')).toBe('hidden');
    second();
    expect(style('overflow')).toBe('');
  });

  it('locks again after it was released, and measures again', () => {
    lockScroll()();
    pageWithScrollbar(10);
    const unlock = lockScroll();
    expect(style('padding-inline-end')).toBe('10px');
    unlock();
  });

  it('locks an element: its scrollbar is what it is wider than its content, less its borders', () => {
    const box = document.createElement('div');
    document.body.append(box);
    Object.defineProperty(box, 'offsetWidth', { value: 300, configurable: true });
    Object.defineProperty(box, 'clientWidth', { value: 281, configurable: true });
    // jsdom does not resolve logical border widths: the computed style says what a browser would.
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
      const computed = real(element, pseudo);
      return element !== box
        ? computed
        : new Proxy(computed, {
            get: (target, key) => (key === 'borderInlineStartWidth' || key === 'borderInlineEndWidth' ? '1px' : Reflect.get(target, key))
          });
    });
    const unlock = lockScroll(box);
    expect(style('overflow', box)).toBe('hidden');
    expect(style('padding-inline-end', box)).toBe('17px');
    expect(style('overflow')).toBe('');
    unlock();
    expect(style('overflow', box)).toBe('');
    expect(style('padding-inline-end', box)).toBe('');
  });

  it('an element with no scrollbar and no borders gets no padding', () => {
    const box = document.createElement('div');
    document.body.append(box);
    const unlock = lockScroll(box);
    expect(style('padding-inline-end', box)).toBe('');
    unlock();
  });
});
