import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveOption } from '../src/lib/internal/options';
import { classList, styleText } from '../src/lib/internal/semantic';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveOption', () => {
  const allowed = ['a', 'b'] as const;

  it('returns an allowed value unchanged', () => {
    expect(resolveOption('Widget', 'mode', 'b', allowed, 'a')).toBe('b');
  });

  it('throws a RangeError naming the component, the option and the allowed values', () => {
    expect(() => resolveOption('Widget', 'mode', 'c', allowed, 'a')).toThrow(RangeError);
    expect(() => resolveOption('Widget', 'mode', 'c', allowed, 'a')).toThrow(
      'Widget mode must be one of: a, b.'
    );
  });

  it('falls back to the default in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(resolveOption('Widget', 'mode', 'c', allowed, 'a')).toBe('a');
    expect(resolveOption('Widget', 'mode', undefined, allowed, 'a')).toBe('a');
  });
});

describe('classList', () => {
  it('joins the set class names in order', () => {
    expect(classList('a', 'b', 'c')).toBe('a b c');
  });

  it('skips undefined, null, false and empty values', () => {
    expect(classList('a', undefined, null, false, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is set', () => {
    expect(classList(undefined, false)).toBe('');
  });
});

describe('styleText', () => {
  it('writes an object as declarations in order', () => {
    expect(styleText({ color: 'red', 'z-index': 2 })).toBe('color: red; z-index: 2');
  });

  it('writes numbers as they are and keeps custom properties', () => {
    expect(styleText({ '--x': 1.5, opacity: 0 })).toBe('--x: 1.5; opacity: 0');
  });

  it('does not convert property names', () => {
    expect(styleText({ backgroundColor: 'red' })).toBe('backgroundColor: red');
  });

  it('skips empty, null and undefined values but keeps zero', () => {
    expect(styleText({ a: '', b: undefined as never, c: null as never, d: 0 })).toBe('d: 0');
  });

  it('merges strings and objects in order and strips trailing semicolons', () => {
    expect(styleText('margin: 1px;;', { color: 'red' }, ' padding: 0 ')).toBe(
      'margin: 1px; color: red; padding: 0'
    );
  });

  it('ignores blank strings and falsy parts', () => {
    expect(styleText('  ', undefined, null, false, ';')).toBeUndefined();
  });

  it('returns undefined when there is nothing to write', () => {
    expect(styleText()).toBeUndefined();
    expect(styleText({})).toBeUndefined();
  });
});
