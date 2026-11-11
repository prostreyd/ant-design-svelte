import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InputTextArea from '../src/lib/Input/InputTextArea.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.querySelectorAll('form, label, span').forEach((element) => {
    if (element.parentElement === document.body) element.remove();
  });
});

const named = { 'aria-label': 'Notes' };
const area = () => screen.getByRole('textbox') as HTMLTextAreaElement;
const root = () => area().closest('.ads-input') as HTMLElement;
const part = (name: string) => root().querySelector(`.ads-input-${name}`) as HTMLElement | null;
const clearButton = () => part('clear') as HTMLButtonElement | null;
const parentValue = () => screen.getByTestId('parent-value').textContent;
const appClasses = (element: Element | null) =>
  [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
const styleOf = (element: Element | null) => (element as HTMLElement).style;

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('InputTextArea', () => {
  // --- Rendering and value ---

  it('default: a native textarea in one element, medium and outlined, with nothing else', () => {
    const { container } = render(InputTextArea, { props: named });
    expect(area().tagName).toBe('TEXTAREA');
    expect(area()).toHaveValue('');
    expect(appClasses(root())).toEqual(['ads-input', 'ads-input-multiline', 'ads-input-medium', 'ads-input-outlined']);
    expect(root().parentElement).toBe(container);
    expect([...root().children]).toEqual([area()]);
    expect(area()).toHaveClass('ads-input-textarea');
    expect(area()).not.toHaveAttribute('style');
    expect(area()).not.toHaveAttribute('aria-invalid');
  });

  it('value: the initial text is shown; null means empty', () => {
    const { unmount } = render(InputTextArea, { props: { ...named, value: 'one\ntwo' } });
    expect(area()).toHaveValue('one\ntwo');
    unmount();
    render(InputTextArea, { props: { ...named, value: null as unknown as string } });
    expect(area()).toHaveValue('');
  });

  it('value: bind:value follows typing, new lines included', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputTextArea, ...named } });
    await user.type(area(), 'a{Enter}b');
    expect(parentValue()).toBe('a\nb');
  });

  it('value: a plain value={x} is the initial text and typing changes it locally', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputTextArea, mode: 'plain', initial: 'x', ...named } });
    await user.type(area(), 'y');
    expect(area()).toHaveValue('xy');
    expect(parentValue()).toBe('x');
  });

  it('value: a change made by the parent updates the field and does not call onchange', async () => {
    const onchange = vi.fn();
    render(FieldHarness, { props: { component: InputTextArea, onchange, ...named } });
    screen.getByTestId('parent-set').click();
    await tick();
    expect(area()).toHaveValue('from parent');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('value: a function binding that refuses an edit puts the old text back', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputTextArea, mode: 'confirm', allow: false, initial: 'ok', ...named } });
    await user.type(area(), 'x');
    expect(area()).toHaveValue('ok');
    expect(parentValue()).toBe('ok');
  });

  // --- disabled, readonly, size, variant, status ---

  it('disabled: native disabled, the class, no typing, no onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(InputTextArea, { props: { ...named, disabled: true, onchange } });
    expect(area()).toBeDisabled();
    expect(root()).toHaveClass('ads-input-disabled');
    await user.type(area(), 'abc');
    expect(area()).toHaveValue('');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('readonly: the native attribute and the class; the text cannot be typed', async () => {
    const user = userEvent.setup();
    render(InputTextArea, { props: { ...named, readonly: true, value: 'fixed' } });
    expect(area()).toHaveAttribute('readonly');
    expect(root()).toHaveClass('ads-input-readonly');
    await user.type(area(), 'x');
    expect(area()).toHaveValue('fixed');
  });

  it.each([
    ['large', 'ads-input-large'],
    ['small', 'ads-input-small'],
    ['medium', 'ads-input-medium'],
    ['middle', 'ads-input-medium'],
    ['default', 'ads-input-medium']
  ] as const)('size: %s gives %s', (size, expected) => {
    render(InputTextArea, { props: { ...named, size } });
    expect(appClasses(root()).filter((name) => /^ads-input-(large|medium|small)$/.test(name))).toEqual([expected]);
  });

  it('size and variant: an invalid value throws outside production and falls back in production', () => {
    expect(() => render(InputTextArea, { props: { ...named, size: 'huge' as never } })).toThrow(RangeError);
    expect(() => render(InputTextArea, { props: { ...named, variant: 'solid' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(InputTextArea, { props: { ...named, size: 'huge' as never, variant: 'solid' as never } });
    expect(appClasses(root())).toEqual(['ads-input', 'ads-input-multiline', 'ads-input-medium', 'ads-input-outlined']);
  });

  it.each(['outlined', 'filled', 'borderless', 'underlined'] as const)('variant: %s is a class', (variant) => {
    render(InputTextArea, { props: { ...named, variant } });
    expect(root()).toHaveClass(`ads-input-${variant}`);
  });

  it('status: error sets the class and aria-invalid; warning only the class; an invalid value throws', () => {
    const { unmount } = render(InputTextArea, { props: { ...named, status: 'error' } });
    expect(root()).toHaveClass('ads-input-status-error');
    expect(area()).toHaveAttribute('aria-invalid', 'true');
    unmount();
    const second = render(InputTextArea, { props: { ...named, status: 'warning' } });
    expect(root()).toHaveClass('ads-input-status-warning');
    expect(area()).not.toHaveAttribute('aria-invalid');
    second.unmount();
    expect(() => render(InputTextArea, { props: { ...named, status: 'info' as never } })).toThrow(RangeError);
  });

  // --- allowClear ---

  it('allowClear: off by default; a named button, hidden while empty, shown with text', async () => {
    const user = userEvent.setup();
    const { unmount } = render(InputTextArea, { props: { ...named, value: 'x' } });
    expect(clearButton()).toBeNull();
    unmount();
    render(InputTextArea, { props: { ...named, allowClear: true } });
    expect(clearButton()).toHaveAttribute('aria-label', 'Clear');
    expect(clearButton()).toHaveClass('ads-input-clear-hidden');
    await user.type(area(), 'a');
    expect(clearButton()).not.toHaveClass('ads-input-clear-hidden');
    expect(area()).toHaveClass('ads-input-textarea-clearable');
  });

  it('allowClear: a click empties the text, keeps focus in the field, calls onchange then onclear', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onchange = vi.fn<(value: string, event: Event) => number>((value) => calls.push(`change:${value}`));
    const onclear = vi.fn(() => calls.push('clear'));
    render(FieldHarness, { props: { component: InputTextArea, initial: 'abc', allowClear: true, onchange, onclear, ...named } });
    await user.click(clearButton()!);
    expect(parentValue()).toBe('');
    expect(area()).toHaveValue('');
    expect(document.activeElement).toBe(area());
    expect(calls).toEqual(['change:', 'clear']);
  });

  it('allowClear: a parent that refuses the change keeps the text, and still hears onchange and onclear', async () => {
    const user = userEvent.setup();
    const onclear = vi.fn();
    render(FieldHarness, { props: { component: InputTextArea, mode: 'confirm', allow: false, initial: 'abc', allowClear: true, onclear, ...named } });
    await user.click(clearButton()!);
    expect(area()).toHaveValue('abc');
    expect(onclear).toHaveBeenCalledTimes(1);
  });

  it('allowClear: nothing to clear while disabled or read-only; the object form sets label, tab index and icon', () => {
    const { unmount } = render(InputTextArea, { props: { ...named, allowClear: true, value: 'abc', disabled: true } });
    expect(clearButton()).toHaveClass('ads-input-clear-hidden');
    unmount();
    const second = render(InputTextArea, { props: { ...named, allowClear: true, value: 'abc', readonly: true } });
    expect(clearButton()).toHaveClass('ads-input-clear-hidden');
    second.unmount();
    render(InputTextArea, { props: { ...named, value: 'a', allowClear: { label: 'Erase', tabIndex: -1, clearIcon: 'x' } } });
    expect(clearButton()).toHaveAttribute('aria-label', 'Erase');
    expect(clearButton()).toHaveAttribute('tabindex', '-1');
    expect(clearButton()).toHaveTextContent('x');
  });

  it('allowClear: the button stays in the DOM when the text empties', async () => {
    const user = userEvent.setup();
    render(InputTextArea, { props: { ...named, allowClear: true, value: 'a' } });
    const button = clearButton();
    await user.clear(area());
    expect(clearButton()).toBe(button);
    expect(button).toHaveClass('ads-input-clear-hidden');
  });

  // --- showCount, count, maxlength ---

  it('showCount: shows the length in its own part, updating while typing; "n / max" with maxlength', async () => {
    const user = userEvent.setup();
    const { unmount } = render(InputTextArea, { props: named });
    expect(part('count')).toBeNull();
    unmount();
    render(InputTextArea, { props: { ...named, showCount: true, maxlength: 5 } });
    expect(part('count')).toHaveTextContent('0 / 5');
    await user.type(area(), 'abcdefg');
    expect(area()).toHaveValue('abcde');
    expect(area()).toHaveAttribute('maxlength', '5');
    expect(part('count')).toHaveTextContent('5 / 5');
  });

  it('showCount: the object form formats the text, and the count part is linked by aria-describedby', () => {
    render(InputTextArea, {
      props: { ...named, value: 'ab', showCount: { formatter: ({ count }: { count: number }) => `${count} chars` }, 'aria-describedby': 'hint' }
    });
    expect(part('count')).toHaveTextContent('2 chars');
    expect(area().getAttribute('aria-describedby')).toBe(`hint ${part('count')!.id}`);
  });

  it('count: max is a soft limit (the text is kept, the field turns invalid); strategy and show are honored', async () => {
    const user = userEvent.setup();
    const { unmount } = render(InputTextArea, { props: { ...named, count: { max: 2, show: true } } });
    await user.type(area(), 'abc');
    expect(area()).toHaveValue('abc');
    expect(part('count')).toHaveClass('ads-input-count-exceeded');
    expect(area()).toHaveAttribute('aria-invalid', 'true');
    unmount();
    const second = render(InputTextArea, { props: { ...named, value: 'a b c', count: { show: true, strategy: (value: string) => value.split(' ').length } } });
    expect(part('count')).toHaveTextContent('3');
    second.unmount();
    render(InputTextArea, { props: { ...named, showCount: true, count: { show: false } } });
    expect(part('count')).toBeNull();
  });

  it('count.exceedFormatter: cuts the text past the limit; with IME only when the composition ends', async () => {
    const user = userEvent.setup();
    const exceedFormatter = (value: string, { max }: { max: number }) => [...value].slice(0, max).join('');
    const { unmount } = render(FieldHarness, { props: { component: InputTextArea, count: { max: 3, exceedFormatter }, ...named } });
    await user.type(area(), 'abcdef');
    expect(area()).toHaveValue('abc');
    unmount();
    render(FieldHarness, { props: { component: InputTextArea, count: { max: 3, exceedFormatter }, ...named } });
    const field = area();
    await fireEvent.compositionStart(field);
    field.value = 'abcdef';
    await fireEvent.input(field);
    expect(field).toHaveValue('abcdef');
    await fireEvent.compositionEnd(field);
    expect(field).toHaveValue('abc');
    expect(parentValue()).toBe('abc');
  });

  it('IME: a refused edit is put back when the composition ends, not before', async () => {
    render(FieldHarness, { props: { component: InputTextArea, mode: 'confirm', allow: false, initial: 'ok', ...named } });
    const field = area();
    await fireEvent.compositionStart(field);
    field.value = 'ok你';
    await fireEvent.input(field);
    expect(field).toHaveValue('ok你');
    await fireEvent.compositionEnd(field);
    expect(field).toHaveValue('ok');
  });

  it('IME: the native composition handlers are forwarded, and an Enter while composing is not an onpressenter', async () => {
    const oncompositionstart = vi.fn();
    const oncompositionend = vi.fn();
    const onpressenter = vi.fn();
    render(InputTextArea, { props: { ...named, oncompositionstart, oncompositionend, onpressenter } });
    await fireEvent.compositionStart(area());
    await fireEvent.keyDown(area(), { key: 'Enter' });
    await fireEvent.compositionEnd(area());
    await fireEvent.keyDown(area(), { key: 'Enter', isComposing: true });
    expect(oncompositionstart).toHaveBeenCalledTimes(1);
    expect(oncompositionend).toHaveBeenCalledTimes(1);
    expect(onpressenter).not.toHaveBeenCalled();
  });

  // --- Callbacks ---

  it('onchange: once per edit with the new text and the native input event; oninput is forwarded and runs first', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onchange = vi.fn<(value: string, event: Event) => number>((value) => calls.push(`change:${value}`));
    render(InputTextArea, { props: { ...named, oninput: () => calls.push('input'), onchange } });
    await user.type(area(), 'ab');
    expect(calls).toEqual(['input', 'change:a', 'input', 'change:ab']);
    expect(onchange.mock.calls[1][1].type).toBe('input');
  });

  it('onpressenter: called on Enter (the new line is still typed), not on other keys', async () => {
    const user = userEvent.setup();
    const onpressenter = vi.fn();
    render(InputTextArea, { props: { ...named, onpressenter } });
    await user.type(area(), 'a');
    expect(onpressenter).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onpressenter).toHaveBeenCalledTimes(1);
    expect(onpressenter.mock.calls[0][0].key).toBe('Enter');
    expect(area()).toHaveValue('a\n');
  });

  it('onpressenter: the native onkeydown is forwarded and runs first', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(InputTextArea, { props: { ...named, onkeydown: () => calls.push('keydown'), onpressenter: () => calls.push('enter') } });
    await user.click(area());
    await user.keyboard('{Enter}');
    expect(calls).toEqual(['keydown', 'enter']);
  });

  // --- Native attributes, classNames, styles ---

  it('native attributes: rows, cols, placeholder, name, id, required, aria-*, data-* and handlers reach the textarea', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    render(InputTextArea, { props: { rows: 4, cols: 20, placeholder: 'Notes here', name: 'notes', id: 'n', required: true, 'data-x': '1', 'aria-label': 'Notes', onfocus } });
    expect(area()).toHaveAttribute('rows', '4');
    expect(area()).toHaveAttribute('cols', '20');
    expect(area()).toHaveAttribute('placeholder', 'Notes here');
    expect(area()).toHaveAttribute('name', 'notes');
    expect(area()).toHaveAttribute('id', 'n');
    expect(area()).toBeRequired();
    expect(area()).toHaveAttribute('data-x', '1');
    await user.click(area());
    expect(onfocus).toHaveBeenCalledTimes(1);
  });

  it('classNames: every part gets its class and keeps the component classes', () => {
    const classNames = { root: 'c-root', textarea: 'c-area', clear: 'c-clear', count: 'c-count' };
    render(InputTextArea, { props: { ...named, value: 'a', allowClear: true, showCount: true, classNames } });
    expect(root()).toHaveClass('ads-input', 'c-root');
    expect(area()).toHaveClass('ads-input-textarea', 'c-area');
    expect(clearButton()).toHaveClass('ads-input-clear', 'c-clear');
    expect(part('count')).toHaveClass('ads-input-count', 'c-count');
  });

  it('styles: every part gets its inline style, and the consumer wins over the component', () => {
    const styles = { root: { color: 'red' }, textarea: { 'font-weight': 'bold' }, clear: { 'margin-top': '3px' }, count: { 'letter-spacing': '2px' } };
    render(InputTextArea, { props: { ...named, value: 'a', allowClear: true, showCount: true, styles } });
    expect(styleOf(root()).color).toBe('red');
    expect(styleOf(area()).fontWeight).toBe('bold');
    expect(styleOf(clearButton()).marginTop).toBe('3px');
    expect(styleOf(part('count')).letterSpacing).toBe('2px');
  });

  it('class and style: reach the root; styles.root is written after style and wins', () => {
    render(InputTextArea, { props: { ...named, class: 'mine', style: 'color: red; margin: 1px', styles: { root: { color: 'blue' } } } });
    expect(root()).toHaveClass('mine');
    expect(styleOf(root()).margin).toBe('1px');
    expect(styleOf(root()).color).toBe('blue');
  });

  it('reactivity: changing size, variant, status and disabled re-renders', async () => {
    const { rerender } = render(InputTextArea, { props: named });
    await rerender({ size: 'small', variant: 'filled', status: 'warning', disabled: true });
    expect(appClasses(root())).toEqual(['ads-input', 'ads-input-multiline', 'ads-input-small', 'ads-input-filled', 'ads-input-status-warning', 'ads-input-disabled']);
    await rerender({ size: 'medium', variant: 'outlined', status: undefined, disabled: false });
    expect(appClasses(root())).toEqual(['ads-input', 'ads-input-multiline', 'ads-input-medium', 'ads-input-outlined']);
  });

  it('structure: turning the clear button and the count on and off keeps the same textarea and its focus', async () => {
    const { rerender } = render(InputTextArea, { props: { ...named, value: 'abc' } });
    const field = area();
    field.focus();
    await rerender({ allowClear: true, showCount: true });
    expect(area()).toBe(field);
    expect(document.activeElement).toBe(field);
    await rerender({ allowClear: false, showCount: false });
    expect(area()).toBe(field);
    expect(document.activeElement).toBe(field);
  });

  // --- Methods and forms ---

  it('focus(), blur() and focus({ cursor }): move focus and place the caret', () => {
    const { component } = render(InputTextArea, { props: { ...named, value: 'hello' } });
    const methods = component as unknown as { focus(options?: { cursor?: 'start' | 'end' | 'all' }): void; blur(): void };
    methods.focus();
    expect(document.activeElement).toBe(area());
    methods.focus({ cursor: 'end' });
    expect([area().selectionStart, area().selectionEnd]).toEqual([5, 5]);
    methods.focus({ cursor: 'all' });
    expect([area().selectionStart, area().selectionEnd]).toEqual([0, 5]);
    methods.blur();
    expect(document.activeElement).not.toBe(area());
  });

  it('focus({ preventScroll }): is passed to the browser', () => {
    const { component } = render(InputTextArea, { props: named });
    const spy = vi.spyOn(area(), 'focus');
    (component as unknown as { focus(options?: { preventScroll?: boolean }): void }).focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('forms: name and value are submitted, and a native reset is put back to the state', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      render(InputTextArea, { target: form, props: { name: 'notes', value: 'kept', ...named } });
      await tick();
      expect(new FormData(form).get('notes')).toBe('kept');
      form.reset();
      expect(area()).toHaveValue('');
      await vi.runAllTimersAsync();
      expect(area()).toHaveValue('kept');
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: removing the textarea removes its reset listener and a later reset does not throw', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      const remove = vi.spyOn(form, 'removeEventListener');
      const { unmount } = render(InputTextArea, { target: form, props: named });
      await tick();
      form.reset();
      unmount();
      await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
      expect(remove).toHaveBeenCalledWith('reset', expect.any(Function));
    } finally {
      vi.useRealTimers();
    }
  });

  // --- autoSize (jsdom has no layout: scrollHeight and the line height are stood in) ---

  /** 20px lines, 4px padding above and below, as `styles.textarea` sets them, so the computed style is known. */
  const lineStyles = { textarea: { 'font-size': '14px', 'line-height': '20px', 'padding-top': '4px', 'padding-bottom': '4px' } };
  const LINE = 20;
  const PADDING = 8;

  function stubLayout() {
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLTextAreaElement) {
        return Math.max(1, this.value.split('\n').length) * LINE + PADDING;
      }
    });
  }

  afterEach(() => {
    delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>).scrollHeight;
  });

  const heightOf = () => area().style.height;
  const settled = (expected: string) => vi.waitFor(() => expect(heightOf()).toBe(expected));

  it('autoSize: off by default: the textarea has no height of its own', async () => {
    stubLayout();
    render(InputTextArea, { props: { ...named, value: 'a\nb\nc', styles: lineStyles } });
    await tick();
    expect(heightOf()).toBe('');
    expect(area()).not.toHaveClass('ads-input-textarea-auto');
  });

  it('autoSize: true sets the height to the content, one line at least, and follows the text', async () => {
    stubLayout();
    const user = userEvent.setup();
    render(InputTextArea, { props: { ...named, autoSize: true, styles: lineStyles } });
    await settled(`${LINE + PADDING}px`);
    expect(area()).toHaveAttribute('rows', '1');
    expect(area()).toHaveClass('ads-input-textarea-auto');
    await user.type(area(), 'a{Enter}b{Enter}c');
    await settled(`${3 * LINE + PADDING}px`);
    expect(area().style.overflowY).toBe('hidden');
    await user.clear(area());
    await settled(`${LINE + PADDING}px`);
  });

  it('autoSize: minRows is the least height', async () => {
    stubLayout();
    render(InputTextArea, { props: { ...named, autoSize: { minRows: 4 }, styles: lineStyles } });
    await settled(`${4 * LINE + PADDING}px`);
  });

  it('autoSize: maxRows is the most height, and the field scrolls past it', async () => {
    stubLayout();
    render(InputTextArea, { props: { ...named, value: 'a\nb\nc\nd\ne', autoSize: { maxRows: 2 }, styles: lineStyles } });
    await settled(`${2 * LINE + PADDING}px`);
    expect(area().style.overflowY).toBe('auto');
  });

  it('autoSize: within minRows and maxRows the content decides, and the field does not scroll', async () => {
    stubLayout();
    render(InputTextArea, { props: { ...named, value: 'a\nb\nc', autoSize: { minRows: 2, maxRows: 5 }, styles: lineStyles } });
    await settled(`${3 * LINE + PADDING}px`);
    expect(area().style.overflowY).toBe('hidden');
  });

  it('autoSize: turning it off releases the height; the consumer style still wins', async () => {
    stubLayout();
    const { rerender } = render(InputTextArea, { props: { ...named, value: 'a\nb', autoSize: true, styles: lineStyles } });
    await settled(`${2 * LINE + PADDING}px`);
    await rerender({ autoSize: false });
    await vi.waitFor(() => expect(heightOf()).toBe(''));
    expect(area()).not.toHaveAttribute('rows');
    await rerender({ autoSize: true, styles: { textarea: { ...lineStyles.textarea, height: '100px' } } });
    await vi.waitFor(() => expect(heightOf()).toBe('100px'));
  });

  describe('autoSize and web fonts (document.fonts is stood in: jsdom has none)', () => {
    const setScrollHeight = (height: number) =>
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', { configurable: true, get: () => height });

    afterEach(() => {
      delete (document as unknown as Record<string, unknown>).fonts;
    });

    it('a web font that finishes loading measures the height again (it changes the line and the wrapping)', async () => {
      stubLayout();
      const fonts = new EventTarget();
      Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
      render(InputTextArea, { props: { ...named, value: 'a\nb', autoSize: true, styles: lineStyles } });
      await settled(`${2 * LINE + PADDING}px`);
      setScrollHeight(100);
      fonts.dispatchEvent(new Event('loadingdone'));
      await settled('100px');
    });

    it('the listener is removed when the textarea goes away, and none is added while autoSize is off', async () => {
      stubLayout();
      const fonts = new EventTarget();
      const add = vi.spyOn(fonts, 'addEventListener');
      const remove = vi.spyOn(fonts, 'removeEventListener');
      Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
      render(InputTextArea, { props: { ...named, styles: lineStyles } }).unmount();
      expect(add).not.toHaveBeenCalled();
      const { unmount } = render(InputTextArea, { props: { ...named, autoSize: true, styles: lineStyles } });
      await tick();
      expect(add).toHaveBeenCalledWith('loadingdone', expect.any(Function));
      unmount();
      expect(remove).toHaveBeenCalledWith('loadingdone', add.mock.calls[0][1]);
    });
  });

  it('autoSize: a change of the width (the text wraps differently) measures again', async () => {
    stubLayout();
    let notify: () => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      }
    );
    let width = 300;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    const { unmount } = render(InputTextArea, { props: { ...named, value: 'a', autoSize: true, styles: lineStyles } });
    await settled(`${LINE + PADDING}px`);
    // The same text now needs more room: the stand-in for the browser's wrapping reports a taller content.
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', { configurable: true, get: () => 2 * LINE + PADDING });
    notify();
    // Only a change of the width counts: the same width measures nothing, now or in the next frame.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    expect(heightOf()).toBe(`${LINE + PADDING}px`);
    width = 150;
    notify();
    // The height is set in the next frame, not inside the observer's callback.
    expect(heightOf()).toBe(`${LINE + PADDING}px`);
    await settled(`${2 * LINE + PADDING}px`);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('autoSize: with no font size, line height or padding reported, it assumes 14px, a 1.2 line and no padding', async () => {
    stubLayout();
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = real(element, pseudo);
      return new Proxy(style, {
        get: (target, key) => (['fontSize', 'lineHeight', 'paddingTop', 'paddingBottom'].includes(String(key)) ? '' : Reflect.get(target, key))
      });
    });
    render(InputTextArea, { props: { ...named, value: 'a\nb\nc\nd', autoSize: { maxRows: 2 } } });
    // 14px font, a 1.2 line (16.8px), no padding: two rows are 33.6px.
    await settled('33.6px');
    vi.restoreAllMocks();
  });

  it('autoSize: a measurement that is waiting for the next frame is cancelled when the textarea goes away', async () => {
    stubLayout();
    let notify: () => void = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
    let width = 300;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(InputTextArea, { props: { ...named, value: 'a', autoSize: true, styles: lineStyles } });
    await settled(`${LINE + PADDING}px`);
    width = 100;
    notify();
    cancel.mockClear();
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it('autoSize: a line height the browser reports as "normal" falls back to the font size', async () => {
    stubLayout();
    render(InputTextArea, { props: { ...named, value: 'a\nb\nc\nd', autoSize: { maxRows: 2 }, styles: { textarea: { 'font-size': '10px', 'padding-top': '0px', 'padding-bottom': '0px' } } } });
    // 10px font, no line height: 12px lines, so two rows are 24px.
    await settled('24px');
  });

  // --- a11y ---

  it('a11y: reports a missing accessible name', async () => {
    const { container } = render(InputTextArea);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('label');
  });

  it.each([
    ['plain', {}],
    ['with text', { value: 'abc' }],
    ['disabled', { disabled: true }],
    ['error', { status: 'error' }],
    ['auto size', { autoSize: true }],
    ['with clear and count', { allowClear: true, showCount: true, value: 'x' }]
  ] as Array<[string, Record<string, unknown>]>)('a11y: has no axe violations: %s', async (_name, props) => {
    const { container } = render(InputTextArea, { props: { ...named, ...props } as never });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
