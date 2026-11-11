// The logic that Input and InputTextArea share (src/lib/Input/field.ts): options, counting, caret placement.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clipText,
  countOf,
  countText,
  focusField,
  isOverLimit,
  normalizeSize,
  resolveCount,
  resolveStatus
} from '../src/lib/Input/field.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('field: size', () => {
  it.each([
    ['large', 'large'],
    ['small', 'small'],
    ['medium', 'medium'],
    ['middle', 'medium'],
    ['default', 'medium']
  ] as const)('normalizeSize(%s) is %s', (given, expected) => {
    expect(normalizeSize(given)).toBe(expected);
  });
});

describe('field: status', () => {
  it('resolveStatus: error and warning pass, nothing is nothing', () => {
    expect(resolveStatus('Input', 'error')).toBe('error');
    expect(resolveStatus('Input', 'warning')).toBe('warning');
    expect(resolveStatus('Input', undefined)).toBeUndefined();
    expect(resolveStatus('Input', null)).toBeUndefined();
  });

  it('resolveStatus: an invalid value throws outside production, with the component name', () => {
    expect(() => resolveStatus('InputTextArea', 'info')).toThrow(RangeError);
    expect(() => resolveStatus('InputTextArea', 'info')).toThrow(/InputTextArea status/);
  });

  it('resolveStatus: an invalid value means no status in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(resolveStatus('Input', 'info')).toBeUndefined();
  });
});

describe('field: count', () => {
  it('resolveCount: off by default; no limit', () => {
    const counting = resolveCount(false, undefined, undefined);
    expect(counting.show).toBe(false);
    expect(counting.max).toBeUndefined();
    expect(counting.softMax).toBeUndefined();
  });

  it('resolveCount: showCount turns it on; the native maxlength is the shown limit and not a soft one', () => {
    const counting = resolveCount(true, undefined, 10);
    expect(counting.show).toBe(true);
    expect(counting.max).toBe(10);
    expect(counting.softMax).toBeUndefined();
  });

  it('resolveCount: maxlength may be a numeric string; an empty one is none', () => {
    expect(resolveCount(true, undefined, '8').max).toBe(8);
    expect(resolveCount(true, undefined, '').max).toBeUndefined();
    expect(resolveCount(true, undefined, null).max).toBeUndefined();
  });

  it('resolveCount: count.max wins over maxlength and is the soft limit', () => {
    const counting = resolveCount(true, { max: 5 }, 10);
    expect(counting.max).toBe(5);
    expect(counting.softMax).toBe(5);
  });

  it('resolveCount: count.show wins over showCount, a function formats', () => {
    expect(resolveCount(true, { show: false }, undefined).show).toBe(false);
    expect(resolveCount(false, { show: true }, undefined).show).toBe(true);
    const formatter = () => 'x';
    expect(resolveCount(false, { show: formatter }, undefined)).toMatchObject({ show: true, formatter });
    expect(resolveCount({ formatter }, undefined, undefined)).toMatchObject({ show: true, formatter });
  });

  it('countOf: code points, so an emoji outside the BMP counts 1 and not 2', () => {
    const counting = resolveCount(true, undefined, undefined);
    expect('😀'.length).toBe(2);
    expect(countOf(counting, '😀a')).toBe(2);
    expect(countOf(counting, '')).toBe(0);
  });

  it('countOf: a combined emoji sequence counts as its code points (5 for a family), not as one', () => {
    const counting = resolveCount(true, undefined, undefined);
    expect(countOf(counting, '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}')).toBe(5);
    expect(countOf(counting, 'e\u0301')).toBe(2);
  });

  it('countOf: the strategy replaces the default count', () => {
    const counting = resolveCount(true, { strategy: (value) => value.split(' ').length }, undefined);
    expect(countOf(counting, 'one two three')).toBe(3);
  });

  it('isOverLimit: only a soft limit can be passed, and only strictly', () => {
    const soft = resolveCount(true, { max: 3 }, undefined);
    expect(isOverLimit(soft, 'abc')).toBe(false);
    expect(isOverLimit(soft, 'abcd')).toBe(true);
    expect(isOverLimit(resolveCount(true, undefined, 3), 'abcdef')).toBe(false);
  });

  it('countText: n, or n / max, or what the formatter returns with the info', () => {
    expect(countText(resolveCount(true, undefined, undefined), 'abc')).toBe('3');
    expect(countText(resolveCount(true, undefined, 10), 'abc')).toBe('3 / 10');
    const formatter = vi.fn(({ count, maxLength, value }) => `${value}:${count}:${maxLength}`);
    expect(countText(resolveCount({ formatter }, { max: 7 }, undefined), 'ab')).toBe('ab:2:7');
    expect(formatter).toHaveBeenCalledWith({ value: 'ab', count: 2, maxLength: 7 });
  });

  it('clipText: cuts only with an exceedFormatter and only past the soft limit', () => {
    const exceedFormatter = vi.fn((value: string, { max }: { max: number }) => [...value].slice(0, max).join(''));
    const counting = resolveCount(true, { max: 3, exceedFormatter }, undefined);
    expect(clipText(counting, 'abc')).toBe('abc');
    expect(exceedFormatter).not.toHaveBeenCalled();
    expect(clipText(counting, 'abcdef')).toBe('abc');
    expect(exceedFormatter).toHaveBeenCalledWith('abcdef', { max: 3 });
    expect(clipText(resolveCount(true, { max: 3 }, undefined), 'abcdef')).toBe('abcdef');
    expect(clipText(resolveCount(true, { exceedFormatter }, undefined), 'abcdef')).toBe('abcdef');
  });
});

describe('field: focus', () => {
  function fake(value: string) {
    return {
      value,
      focus: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn()
    } as unknown as HTMLInputElement;
  }

  it('focusField: does nothing without an element', () => {
    expect(() => focusField(undefined, { cursor: 'end' })).not.toThrow();
  });

  it('focusField: focuses, passing preventScroll', () => {
    const element = fake('abc');
    focusField(element, { preventScroll: true });
    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(element.setSelectionRange).not.toHaveBeenCalled();
    expect(element.select).not.toHaveBeenCalled();
  });

  it('focusField: the cursor option places the caret or selects the text', () => {
    const start = fake('abc');
    focusField(start, { cursor: 'start' });
    expect(start.setSelectionRange).toHaveBeenCalledWith(0, 0);
    const end = fake('abc');
    focusField(end, { cursor: 'end' });
    expect(end.setSelectionRange).toHaveBeenCalledWith(3, 3);
    const all = fake('abc');
    focusField(all, { cursor: 'all' });
    expect(all.select).toHaveBeenCalledTimes(1);
  });

  it('focusField: an input type without a selection (it throws) is not an error', () => {
    const element = fake('abc');
    (element.setSelectionRange as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new DOMException('no selection', 'InvalidStateError');
    });
    expect(() => focusField(element, { cursor: 'end' })).not.toThrow();
    expect(element.focus).toHaveBeenCalled();
  });
});
