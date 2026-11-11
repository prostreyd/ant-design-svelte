import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Input from '../src/lib/Input/Input.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('form, label, span').forEach((element) => {
    if (element.parentElement === document.body) element.remove();
  });
});

const named = { 'aria-label': 'Name' };
const field = () => screen.getByRole('textbox') as HTMLInputElement;
/** The bordered box around the input. */
const box = () => field().closest('.ads-input') as HTMLElement;
/** The outermost element: the box, or the group that joins the box to its addons. */
const root = () => (box().parentElement?.classList.contains('ads-input-group') ? box().parentElement : box()) as HTMLElement;
const part = (name: string) => root().querySelector(`.ads-input-${name}`) as HTMLElement | null;
const clearButton = () => part('clear') as HTMLButtonElement | null;
const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));
const parentValue = () => screen.getByTestId('parent-value').textContent;
/** The component's own classes; Svelte adds a generated scoping class that tests ignore. */
const appClasses = (element: Element | null) =>
  [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
const styleOf = (element: Element | null) => (element as HTMLElement).style;

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('Input', () => {
  // --- Rendering and defaults ---

  it('default: a native text input in one element, medium and outlined, with nothing else', () => {
    const { container } = render(Input, { props: named });
    expect(field().tagName).toBe('INPUT');
    expect(field()).toHaveAttribute('type', 'text');
    expect(field()).toHaveValue('');
    expect(field()).not.toBeDisabled();
    expect(appClasses(root())).toEqual(['ads-input', 'ads-input-medium', 'ads-input-outlined']);
    expect(root()).toBe(box());
    expect(root().parentElement).toBe(container);
    expect(field().parentElement).toBe(root());
    expect([...root().children]).toEqual([field()]);
    expect(field()).toHaveClass('ads-input-input');
    expect(field()).not.toHaveAttribute('aria-invalid');
    expect(field()).not.toHaveAttribute('aria-describedby');
  });

  // --- value ---

  it('value: the initial text is shown; null and undefined mean empty', () => {
    const { unmount } = render(Input, { props: { ...named, value: 'hello' } });
    expect(field()).toHaveValue('hello');
    unmount();
    render(Input, { props: { ...named, value: null as unknown as string } });
    expect(field()).toHaveValue('');
  });

  it('value: bind:value follows typing in the parent', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: Input, ...named } });
    await user.type(field(), 'abc');
    expect(parentValue()).toBe('abc');
    expect(field()).toHaveValue('abc');
  });

  it('value: a plain value={x} is the initial text and typing changes it locally', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: Input, mode: 'plain', initial: 'x', ...named } });
    await user.type(field(), 'yz');
    expect(field()).toHaveValue('xyz');
    expect(parentValue()).toBe('x');
  });

  it('value: a change made by the parent updates the input and does not call onchange', async () => {
    const onchange = vi.fn();
    render(FieldHarness, { props: { component: Input, onchange, ...named } });
    screen.getByTestId('parent-set').click();
    await tick();
    expect(field()).toHaveValue('from parent');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('value: a function binding that refuses an edit puts the old text back', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: Input, mode: 'confirm', allow: false, initial: 'ok', ...named } });
    await user.type(field(), 'x');
    expect(field()).toHaveValue('ok');
    expect(parentValue()).toBe('ok');
  });

  it('value: a function binding that accepts an edit takes it', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: Input, mode: 'confirm', allow: true, ...named } });
    await user.type(field(), 'x');
    expect(field()).toHaveValue('x');
    expect(parentValue()).toBe('x');
  });

  // --- type, disabled, readonly ---

  it('type: is written to the input; text-like types are accepted', () => {
    const { unmount } = render(Input, { props: { ...named, type: 'email' } });
    expect(field()).toHaveAttribute('type', 'email');
    unmount();
    render(Input, { props: { ...named, type: 'number' } });
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it.each(['tel', 'url', 'search'])('type: %s is accepted, typed into and reported like text', async (type) => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Input, { props: { ...named, type, onchange } });
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', type);
    await user.type(input, '12');
    expect(input).toHaveValue('12');
    expect(onchange).toHaveBeenLastCalledWith('12', expect.any(Event));
  });

  it('disabled: native disabled, the class, no typing, no onchange, no Tab stop', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Input, { props: { ...named, disabled: true, onchange } });
    expect(field()).toBeDisabled();
    expect(root()).toHaveClass('ads-input-disabled');
    await user.type(field(), 'abc');
    await user.tab();
    expect(field()).toHaveValue('');
    expect(document.activeElement).not.toBe(field());
    expect(onchange).not.toHaveBeenCalled();
  });

  it('readonly: the native attribute and the class; the text cannot be typed', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, readonly: true, value: 'fixed' } });
    expect(field()).toHaveAttribute('readonly');
    expect(root()).toHaveClass('ads-input-readonly');
    await user.type(field(), 'x');
    expect(field()).toHaveValue('fixed');
  });

  // --- size, variant, status ---

  it.each([
    ['large', 'ads-input-large'],
    ['medium', 'ads-input-medium'],
    ['small', 'ads-input-small'],
    ['middle', 'ads-input-medium'],
    ['default', 'ads-input-medium']
  ] as const)('size: %s gives %s (middle and default are aliases of medium)', (size, expected) => {
    render(Input, { props: { ...named, size } });
    expect(appClasses(root())).toContain(expected);
    expect(appClasses(root()).filter((name) => /^ads-input-(large|medium|small)$/.test(name))).toEqual([expected]);
  });

  it('size: an invalid value throws a RangeError outside production', () => {
    expect(() => render(Input, { props: { ...named, size: 'huge' as never } })).toThrow(RangeError);
  });

  it('size: an invalid value falls back to medium in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(Input, { props: { ...named, size: 'huge' as never } });
    expect(root()).toHaveClass('ads-input-medium');
  });

  it.each(['outlined', 'filled', 'borderless', 'underlined'] as const)('variant: %s is a class', (variant) => {
    render(Input, { props: { ...named, variant } });
    expect(root()).toHaveClass(`ads-input-${variant}`);
  });

  it('variant: an invalid value throws outside production and is outlined in production', () => {
    expect(() => render(Input, { props: { ...named, variant: 'solid' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Input, { props: { ...named, variant: 'solid' as never } });
    expect(root()).toHaveClass('ads-input-outlined');
  });

  it('status: error sets the class and aria-invalid; warning sets the class and no aria state', () => {
    const { unmount } = render(Input, { props: { ...named, status: 'error' } });
    expect(root()).toHaveClass('ads-input-status-error');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    unmount();
    render(Input, { props: { ...named, status: 'warning' } });
    expect(root()).toHaveClass('ads-input-status-warning');
    expect(field()).not.toHaveAttribute('aria-invalid');
  });

  it('status: a consumer aria-invalid is kept when there is no error', () => {
    render(Input, { props: { ...named, 'aria-invalid': 'true' } });
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('status: an invalid value throws outside production and means none in production', () => {
    expect(() => render(Input, { props: { ...named, status: 'info' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Input, { props: { ...named, status: 'info' as never } });
    expect(appClasses(root()).some((name) => name.startsWith('ads-input-status-'))).toBe(false);
  });

  // --- prefix, suffix, addons ---

  it('prefix and suffix: text or a snippet, in the parts, before and after the input', () => {
    render(Input, { props: { ...named, prefix: '$', suffix: text('USD') } });
    expect(part('prefix')).toHaveTextContent('$');
    expect(part('suffix')?.querySelector('b')).toHaveTextContent('USD');
    const order = [...box().children];
    expect(order.indexOf(part('prefix')!)).toBeLessThan(order.indexOf(field()));
    expect(order.indexOf(part('suffix')!)).toBeGreaterThan(order.indexOf(field()));
  });

  it('prefix and suffix: not rendered when empty', () => {
    render(Input, { props: { ...named, prefix: '', suffix: undefined } });
    expect(part('prefix')).toBeNull();
    expect(part('suffix')).toBeNull();
  });

  it('addonBefore and addonAfter: text or a snippet, outside the field, in a group that has the look classes', () => {
    render(Input, { props: { ...named, addonBefore: 'https://', addonAfter: text('.com') } });
    const cells = root().querySelectorAll('.ads-input-addon');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveClass('ads-input-addon-before');
    expect(cells[0]).toHaveTextContent('https://');
    expect(cells[1]).toHaveClass('ads-input-addon-after');
    expect(cells[1].querySelector('b')).toHaveTextContent('.com');
    expect(root()).toHaveClass('ads-input-group');
    expect([...root().children]).toEqual([cells[0], box(), cells[1]]);
    expect(box()).not.toBe(root());
    expect(box()).toHaveClass('ads-input-has-addon-before', 'ads-input-has-addon-after');
    expect(root()).toHaveClass('ads-input-has-addon-before', 'ads-input-has-addon-after');
  });

  it('addons: the group takes the look of the field (size, variant, status, disabled)', () => {
    render(Input, { props: { ...named, addonAfter: '.com', size: 'large', variant: 'filled', status: 'error', disabled: true } });
    for (const element of [root(), box()]) {
      expect(element).toHaveClass('ads-input-large', 'ads-input-filled', 'ads-input-status-error', 'ads-input-disabled');
    }
  });

  it('addons: class, classNames.root, style and styles.root reach the group, not the box', () => {
    render(Input, {
      props: { ...named, addonBefore: '@', class: 'mine', classNames: { root: 'also' }, style: 'margin: 1px', styles: { root: { color: 'blue' } } }
    });
    expect(root()).toHaveClass('ads-input-group', 'mine', 'also');
    expect(styleOf(root()).margin).toBe('1px');
    expect(styleOf(root()).color).toBe('blue');
    expect(box()).not.toHaveClass('mine');
    expect(box()).not.toHaveClass('also');
    expect(box()).not.toHaveAttribute('style');
  });

  it('addons: adding or removing a second addon keeps the same input (and its focus)', async () => {
    const { rerender } = render(Input, { props: { ...named, addonBefore: 'https://' } });
    const input = field();
    input.focus();
    await rerender({ addonAfter: '.com' });
    expect(field()).toBe(input);
    expect(document.activeElement).toBe(input);
    await rerender({ addonBefore: undefined });
    expect(field()).toBe(input);
    expect(document.activeElement).toBe(input);
  });

  // --- allowClear ---

  it('allowClear: off by default: no clear button', () => {
    render(Input, { props: { ...named, value: 'x' } });
    expect(clearButton()).toBeNull();
  });

  it('allowClear: the button is a named native button, hidden (but in place) while the text is empty', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, allowClear: true } });
    expect(clearButton()!.tagName).toBe('BUTTON');
    expect(clearButton()).toHaveAttribute('type', 'button');
    expect(clearButton()).toHaveAttribute('aria-label', 'Clear');
    expect(clearButton()).toHaveClass('ads-input-clear-hidden');
    await user.type(field(), 'a');
    expect(clearButton()).not.toHaveClass('ads-input-clear-hidden');
  });

  it('allowClear: a click empties the text, keeps focus in the input, calls onchange then onclear', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onchange = vi.fn<(value: string, event: Event) => number>((value) => calls.push(`change:${value}`));
    const onclear = vi.fn<(event: MouseEvent) => number>(() => calls.push('clear'));
    render(FieldHarness, { props: { component: Input, initial: 'abc', allowClear: true, onchange, onclear, ...named } });
    await user.click(clearButton()!);
    expect(parentValue()).toBe('');
    expect(field()).toHaveValue('');
    expect(document.activeElement).toBe(field());
    expect(calls).toEqual(['change:', 'clear']);
    expect(onchange.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
    expect(onclear.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it('allowClear: a parent that refuses the change keeps the text, and still hears onchange and onclear', async () => {
    const user = userEvent.setup();
    const onclear = vi.fn();
    render(FieldHarness, { props: { component: Input, mode: 'confirm', allow: false, initial: 'abc', allowClear: true, onclear, ...named } });
    await user.click(clearButton()!);
    expect(field()).toHaveValue('abc');
    expect(parentValue()).toBe('abc');
    expect(onclear).toHaveBeenCalledTimes(1);
  });

  it('allowClear: a press on the button does not take focus from the input', () => {
    render(Input, { props: { ...named, allowClear: true, value: 'abc' } });
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    clearButton()!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('allowClear: the button works from the keyboard (Enter and Space)', async () => {
    const user = userEvent.setup();
    const onclear = vi.fn();
    render(Input, { props: { ...named, allowClear: true, value: 'abc', onclear } });
    clearButton()!.focus();
    await user.keyboard('{Enter}');
    expect(onclear).toHaveBeenCalledTimes(1);
    expect(field()).toHaveValue('');
    await user.type(field(), 'x');
    clearButton()!.focus();
    await user.keyboard(' ');
    expect(onclear).toHaveBeenCalledTimes(2);
  });

  it('allowClear: nothing to clear while disabled or read-only', () => {
    const { unmount } = render(Input, { props: { ...named, allowClear: true, value: 'abc', disabled: true } });
    expect(clearButton()).toHaveClass('ads-input-clear-hidden');
    unmount();
    render(Input, { props: { ...named, allowClear: true, value: 'abc', readonly: true } });
    expect(clearButton()).toHaveClass('ads-input-clear-hidden');
  });

  it('allowClear: the object form sets the label, the tab index and the icon (text or snippet)', () => {
    const { unmount } = render(Input, {
      props: { ...named, value: 'a', allowClear: { label: 'Erase', tabIndex: -1, clearIcon: 'x' } }
    });
    expect(clearButton()).toHaveAttribute('aria-label', 'Erase');
    expect(clearButton()).toHaveAttribute('tabindex', '-1');
    expect(clearButton()).toHaveTextContent('x');
    expect(clearButton()!.querySelector('svg')).toBeNull();
    unmount();
    render(Input, { props: { ...named, value: 'a', allowClear: { clearIcon: text('cut') } } });
    expect(clearButton()!.querySelector('b')).toHaveTextContent('cut');
  });

  it('allowClear: the default icon is a decorative svg and the button has no tabindex of its own', () => {
    render(Input, { props: { ...named, value: 'a', allowClear: true } });
    expect(clearButton()!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(clearButton()).not.toHaveAttribute('tabindex');
  });

  // --- showCount, count, maxlength ---

  it('showCount: shows the length, updating while typing; off by default', async () => {
    const user = userEvent.setup();
    const { unmount } = render(Input, { props: named });
    expect(part('count')).toBeNull();
    unmount();
    render(Input, { props: { ...named, showCount: true } });
    expect(part('count')).toHaveTextContent('0');
    await user.type(field(), 'abc');
    expect(part('count')).toHaveTextContent('3');
  });

  it('showCount: with maxlength it shows "n / max" and the native limit holds', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, showCount: true, maxlength: 4 } });
    await user.type(field(), 'abcdef');
    expect(field()).toHaveValue('abcd');
    expect(field()).toHaveAttribute('maxlength', '4');
    expect(part('count')).toHaveTextContent('4 / 4');
  });

  it('showCount: the object form formats the text', () => {
    const formatter = vi.fn(({ count, maxLength }: { count: number; maxLength?: number }) => `${count} of ${maxLength}`);
    render(Input, { props: { ...named, value: 'ab', maxlength: 9, showCount: { formatter } } });
    expect(part('count')).toHaveTextContent('2 of 9');
    expect(formatter).toHaveBeenCalledWith({ value: 'ab', count: 2, maxLength: 9 });
  });

  it('showCount: the count part is linked to the input by aria-describedby, after the consumer ids', () => {
    render(Input, { props: { ...named, showCount: true, 'aria-describedby': 'hint' } });
    const ids = field().getAttribute('aria-describedby')!.split(' ');
    expect(ids[0]).toBe('hint');
    expect(ids[1]).toBe(part('count')!.id);
    expect(part('count')!.id).not.toBe('');
  });

  it('showCount: the count is not a live region (it would announce every key)', () => {
    render(Input, { props: { ...named, showCount: true, value: 'abc' } });
    expect(part('count')).toHaveTextContent('3');
    for (const element of [part('count')!, root(), field()]) {
      expect(element).not.toHaveAttribute('aria-live');
      expect(element).not.toHaveAttribute('role');
    }
    expect(root().querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull();
  });

  it('showCount: without the count the consumer aria-describedby is left alone', () => {
    render(Input, { props: { ...named, 'aria-describedby': 'hint' } });
    expect(field()).toHaveAttribute('aria-describedby', 'hint');
  });

  it('count.max: a soft limit: past it the count and the field turn invalid, the text is kept', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, count: { max: 3, show: true } } });
    await user.type(field(), 'abc');
    expect(part('count')).not.toHaveClass('ads-input-count-exceeded');
    expect(field()).not.toHaveAttribute('aria-invalid');
    await user.type(field(), 'd');
    expect(field()).toHaveValue('abcd');
    expect(part('count')).toHaveTextContent('4 / 3');
    expect(part('count')).toHaveClass('ads-input-count-exceeded');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('count.strategy: replaces the count (an emoji can count as one)', async () => {
    render(Input, { props: { ...named, value: '😀😀', count: { show: true, strategy: (value: string) => value.length } } });
    expect(part('count')).toHaveTextContent('4');
  });

  it('count.show: a function formats the text; false hides a showCount', () => {
    const { unmount } = render(Input, { props: { ...named, value: 'ab', count: { show: ({ count }: { count: number }) => `#${count}` } } });
    expect(part('count')).toHaveTextContent('#2');
    unmount();
    render(Input, { props: { ...named, showCount: true, count: { show: false } } });
    expect(part('count')).toBeNull();
  });

  it('count.exceedFormatter: cuts the text when it passes the limit, and only then', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const exceedFormatter = (value: string, { max }: { max: number }) => [...value].slice(0, max).join('');
    render(FieldHarness, { props: { component: Input, onchange, count: { max: 3, exceedFormatter }, ...named } });
    await user.type(field(), 'abcdef');
    expect(field()).toHaveValue('abc');
    expect(parentValue()).toBe('abc');
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['a', 'ab', 'abc']);
  });

  it('count.exceedFormatter: without it nothing is cut', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, count: { max: 2 } } });
    await user.type(field(), 'abcdef');
    expect(field()).toHaveValue('abcdef');
  });

  // --- onchange, onpressenter, native handlers ---

  it('onchange: once per edit with the new text and the native input event', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Input, { props: { ...named, onchange } });
    await user.type(field(), 'ab');
    expect(onchange).toHaveBeenCalledTimes(2);
    expect(onchange.mock.calls[0][0]).toBe('a');
    expect(onchange.mock.calls[1][0]).toBe('ab');
    expect(onchange.mock.calls[1][1].type).toBe('input');
    expect((onchange.mock.calls[1][1].target as HTMLInputElement).value).toBe('ab');
  });

  it('onchange: rapid edits in a row each call it once, in order, without awaiting between them', async () => {
    const onchange = vi.fn<(value: string, event: Event) => void>();
    render(Input, { props: { ...named, onchange } });
    for (const next of ['a', 'ab', 'abc', 'ab', '']) {
      field().value = next;
      field().dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['a', 'ab', 'abc', 'ab', '']);
    expect(field()).toHaveValue('');
  });

  it('onchange: pasting text is one edit', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Input, { props: { ...named, onchange } });
    await user.click(field());
    await user.paste('hello');
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledWith('hello', expect.any(Event));
  });

  it('onchange: the native oninput is forwarded as well, and runs first', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(Input, {
      props: { ...named, oninput: () => calls.push('input'), onchange: () => calls.push('change') }
    });
    await user.type(field(), 'a');
    expect(calls).toEqual(['input', 'change']);
  });

  it('onpressenter: called on Enter with the keyboard event, not on other keys', async () => {
    const user = userEvent.setup();
    const onpressenter = vi.fn();
    render(Input, { props: { ...named, onpressenter } });
    await user.type(field(), 'a');
    expect(onpressenter).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onpressenter).toHaveBeenCalledTimes(1);
    expect(onpressenter.mock.calls[0][0].key).toBe('Enter');
  });

  it('onpressenter: the native onkeydown is forwarded and runs first', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(Input, { props: { ...named, onkeydown: () => calls.push('keydown'), onpressenter: () => calls.push('enter') } });
    await user.click(field());
    await user.keyboard('{Enter}');
    expect(calls).toEqual(['keydown', 'enter']);
  });

  // --- IME ---

  it('IME: edits during a composition are reported as they come; the end adds nothing', async () => {
    const onchange = vi.fn();
    render(Input, { props: { ...named, onchange } });
    const input = field();
    await fireEvent.compositionStart(input);
    input.value = 'ni';
    await fireEvent.input(input);
    input.value = '你';
    await fireEvent.input(input);
    await fireEvent.compositionEnd(input);
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['ni', '你']);
  });

  it('IME: Enter that confirms a candidate is not an onpressenter, a later Enter is', async () => {
    const onpressenter = vi.fn();
    render(Input, { props: { ...named, onpressenter } });
    const input = field();
    await fireEvent.compositionStart(input);
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onpressenter).not.toHaveBeenCalled();
    await fireEvent.compositionEnd(input);
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onpressenter).toHaveBeenCalledTimes(1);
  });

  it('IME: an Enter the browser marks as composing is not an onpressenter either', async () => {
    const onpressenter = vi.fn();
    render(Input, { props: { ...named, onpressenter } });
    await fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });
    expect(onpressenter).not.toHaveBeenCalled();
  });

  it('IME: the text is cut by exceedFormatter when the composition ends, not in the middle of it', async () => {
    const onchange = vi.fn();
    const exceedFormatter = (value: string, { max }: { max: number }) => [...value].slice(0, max).join('');
    render(FieldHarness, { props: { component: Input, onchange, count: { max: 3, exceedFormatter }, ...named } });
    const input = field();
    await fireEvent.compositionStart(input);
    input.value = 'abcdef';
    await fireEvent.input(input);
    expect(input).toHaveValue('abcdef');
    expect(parentValue()).toBe('abcdef');
    await fireEvent.compositionEnd(input);
    expect(input).toHaveValue('abc');
    expect(parentValue()).toBe('abc');
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['abcdef', 'abc']);
  });

  it('IME: a refused edit is put back when the composition ends, not before', async () => {
    render(FieldHarness, { props: { component: Input, mode: 'confirm', allow: false, initial: 'ok', ...named } });
    const input = field();
    await fireEvent.compositionStart(input);
    input.value = 'ok你';
    await fireEvent.input(input);
    expect(input).toHaveValue('ok你');
    await fireEvent.compositionEnd(input);
    expect(input).toHaveValue('ok');
  });

  it('IME: the native composition handlers are forwarded', async () => {
    const oncompositionstart = vi.fn();
    const oncompositionend = vi.fn();
    render(Input, { props: { ...named, oncompositionstart, oncompositionend } });
    await fireEvent.compositionStart(field());
    await fireEvent.compositionEnd(field());
    expect(oncompositionstart).toHaveBeenCalledTimes(1);
    expect(oncompositionend).toHaveBeenCalledTimes(1);
  });

  // --- Stable structure ---

  it('structure: turning the affixes, the clear button, the count and a second addon on and off keeps the same input and its focus', async () => {
    const { rerender } = render(Input, { props: { ...named, value: 'abc', addonBefore: 'http://' } });
    const input = field();
    input.focus();
    await rerender({
      prefix: '$',
      suffix: '.00',
      addonAfter: '.com',
      allowClear: true,
      showCount: true
    });
    expect(field()).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(input.selectionEnd);
    await rerender({
      prefix: undefined,
      suffix: undefined,
      addonAfter: undefined,
      allowClear: false,
      showCount: false
    });
    expect(field()).toBe(input);
    expect(document.activeElement).toBe(input);
  });

  it('structure: the first addon adds the group around the field (the input is created again), the last one removes it', async () => {
    const { rerender } = render(Input, { props: named });
    expect(root()).toBe(box());
    await rerender({ addonAfter: '.com' });
    expect(root()).toHaveClass('ads-input-group');
    expect(box().parentElement).toBe(root());
    await rerender({ addonAfter: undefined });
    expect(root()).toBe(box());
    expect(document.querySelector('.ads-input-group')).toBeNull();
  });

  it('structure: the clear button stays in the DOM when the text empties (the layout does not move)', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, allowClear: true, value: 'a' } });
    const button = clearButton();
    await user.clear(field());
    expect(clearButton()).toBe(button);
    expect(button).toHaveClass('ads-input-clear-hidden');
  });

  // --- Reactivity ---

  it('reactivity: changing size, variant, status and disabled re-renders the classes', async () => {
    const { rerender } = render(Input, { props: named });
    await rerender({ size: 'large', variant: 'filled', status: 'warning', disabled: true });
    expect(appClasses(root())).toEqual([
      'ads-input',
      'ads-input-large',
      'ads-input-filled',
      'ads-input-status-warning',
      'ads-input-disabled'
    ]);
    expect(field()).toBeDisabled();
    await rerender({ size: 'small', variant: 'outlined', status: undefined, disabled: false });
    expect(appClasses(root())).toEqual(['ads-input', 'ads-input-small', 'ads-input-outlined']);
    expect(field()).not.toBeDisabled();
  });

  // --- Native attributes ---

  it('native attributes: id, name, placeholder, required, autocomplete, inputmode, title, data-* and aria-* reach the input', () => {
    render(Input, {
      props: {
        id: 'who',
        name: 'who',
        placeholder: 'Your name',
        required: true,
        autocomplete: 'name',
        inputmode: 'text',
        title: 'Name',
        'data-x': '1',
        'aria-label': 'Name'
      }
    });
    expect(field()).toHaveAttribute('id', 'who');
    expect(field()).toHaveAttribute('name', 'who');
    expect(field()).toHaveAttribute('placeholder', 'Your name');
    expect(field()).toBeRequired();
    expect(field()).toHaveAttribute('autocomplete', 'name');
    expect(field()).toHaveAttribute('inputmode', 'text');
    expect(field()).toHaveAttribute('title', 'Name');
    expect(field()).toHaveAttribute('data-x', '1');
    expect(field()).toHaveAttribute('aria-label', 'Name');
  });

  it('native attributes: tabindex, autofocus, form, minlength, pattern and spellcheck reach the input', () => {
    const form = document.createElement('form');
    form.id = 'outer';
    document.body.append(form);
    render(Input, {
      props: { ...named, tabindex: -1, autofocus: true, form: 'outer', minlength: 2, pattern: '[a-z]+', spellcheck: false } as never
    });
    expect(field()).toHaveAttribute('tabindex', '-1');
    expect(field().form).toBe(form);
    expect(field()).toHaveAttribute('minlength', '2');
    expect(field()).toHaveAttribute('pattern', '[a-z]+');
    expect(field()).toHaveAttribute('spellcheck', 'false');
    expect(document.activeElement).toBe(field());
    form.remove();
  });

  it('native attributes: onfocus and onblur are forwarded', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Input, { props: { ...named, onfocus, onblur } });
    await user.click(field());
    expect(onfocus).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onblur).toHaveBeenCalledTimes(1);
  });

  // --- classNames, styles, class, style ---

  const allParts = { prefix: 'p', suffix: 's', allowClear: true, showCount: true, value: 'a', ...named };

  it('classNames: every part gets its class and keeps the component classes', () => {
    const classNames = { root: 'c-root', prefix: 'c-prefix', input: 'c-input', suffix: 'c-suffix', clear: 'c-clear', count: 'c-count' };
    render(Input, { props: { ...allParts, classNames } });
    expect(root()).toHaveClass('ads-input', 'c-root');
    expect(part('prefix')).toHaveClass('ads-input-prefix', 'c-prefix');
    expect(field()).toHaveClass('ads-input-input', 'c-input');
    expect(part('suffix')).toHaveClass('ads-input-suffix', 'c-suffix');
    expect(clearButton()).toHaveClass('ads-input-clear', 'c-clear');
    expect(part('count')).toHaveClass('ads-input-count', 'c-count');
  });

  it('styles: every part gets its inline style; numbers as they are; custom properties; the consumer wins', () => {
    const styles = {
      root: { color: 'red' },
      prefix: { opacity: 0.5 },
      input: { 'font-weight': 'bold' },
      suffix: { '--mine': '1' },
      clear: { 'margin-top': '3px' },
      count: { 'letter-spacing': '2px' }
    };
    render(Input, { props: { ...allParts, styles } });
    expect(styleOf(root()).color).toBe('red');
    expect(styleOf(part('prefix')).opacity).toBe('0.5');
    expect(styleOf(field()).fontWeight).toBe('bold');
    expect(styleOf(part('suffix')).getPropertyValue('--mine')).toBe('1');
    expect(styleOf(clearButton()).marginTop).toBe('3px');
    expect(styleOf(part('count')).letterSpacing).toBe('2px');
  });

  it('styles: update reactively and are removed when cleared', async () => {
    const { rerender } = render(Input, { props: { ...named, styles: { input: { color: 'red' } } } });
    expect(styleOf(field()).color).toBe('red');
    await rerender({ styles: { input: { color: 'blue' } } });
    expect(styleOf(field()).color).toBe('blue');
    await rerender({ styles: undefined });
    expect(field()).not.toHaveAttribute('style');
  });

  it('class and style: reach the root; styles.root is written after style and wins', () => {
    render(Input, { props: { ...named, class: 'mine', classNames: { root: 'also' }, style: 'color: red; margin: 1px', styles: { root: { color: 'blue' } } } });
    expect(root()).toHaveClass('ads-input', 'mine', 'also');
    expect(styleOf(root()).margin).toBe('1px');
    expect(styleOf(root()).color).toBe('blue');
  });

  // --- Methods ---

  it('focus() and blur(): move and remove focus', () => {
    const { component } = render(Input, { props: named });
    (component as unknown as { focus(): void }).focus();
    expect(document.activeElement).toBe(field());
    (component as unknown as { blur(): void }).blur();
    expect(document.activeElement).not.toBe(field());
  });

  it('focus({ cursor }): puts the caret at the start or the end, or selects all', () => {
    const { component } = render(Input, { props: { ...named, value: 'hello' } });
    const methods = component as unknown as { focus(options?: { cursor?: 'start' | 'end' | 'all' }): void };
    methods.focus({ cursor: 'start' });
    expect([field().selectionStart, field().selectionEnd]).toEqual([0, 0]);
    methods.focus({ cursor: 'end' });
    expect([field().selectionStart, field().selectionEnd]).toEqual([5, 5]);
    methods.focus({ cursor: 'all' });
    expect([field().selectionStart, field().selectionEnd]).toEqual([0, 5]);
  });

  it('focus({ preventScroll }): is passed to the browser', () => {
    const { component } = render(Input, { props: named });
    const spy = vi.spyOn(field(), 'focus');
    (component as unknown as { focus(options?: { preventScroll?: boolean }): void }).focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('focus({ cursor }): an input type with no selection (email) is not an error', () => {
    const { component } = render(Input, { props: { ...named, type: 'email', value: 'a@b.c' } });
    expect(() => (component as unknown as { focus(options: { cursor: 'end' }): void }).focus({ cursor: 'end' })).not.toThrow();
    expect(document.activeElement).toBe(field());
  });

  // --- Forms ---

  it('forms: name and value are submitted with the form', () => {
    const form = document.createElement('form');
    document.body.append(form);
    render(Input, { target: form, props: { name: 'q', value: 'cats', ...named } });
    expect(new FormData(form).get('q')).toBe('cats');
  });

  it('forms: a native reset does not leave the input out of step with the state', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      render(Input, { target: form, props: { ...named, value: 'kept' } });
      await tick();
      form.reset();
      expect(field()).toHaveValue('');
      await vi.runAllTimersAsync();
      expect(field()).toHaveValue('kept');
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: after a reset the parent resets its state and the input follows', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      render(FieldHarness, { target: form, props: { component: Input, initial: '', ...named } });
      await tick();
      screen.getByTestId('parent-set').click();
      await tick();
      expect(field()).toHaveValue('from parent');
      form.addEventListener('reset', () => screen.getByTestId('parent-reset').click());
      form.reset();
      await vi.runAllTimersAsync();
      expect(parentValue()).toBe('');
      expect(field()).toHaveValue('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: a reset after the input was removed does nothing and does not throw', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      const { unmount } = render(Input, { target: form, props: { ...named, value: 'x' } });
      await tick();
      form.reset();
      unmount();
      await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: removing the input removes its reset listener', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const remove = vi.spyOn(form, 'removeEventListener');
    const { unmount } = render(Input, { target: form, props: named });
    await tick();
    unmount();
    await tick();
    expect(remove).toHaveBeenCalledWith('reset', expect.any(Function));
  });

  // --- a11y ---

  it('a11y: reports a missing accessible name', async () => {
    const { container } = render(Input);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('label');
  });

  it('a11y: an external <label for> names the input', async () => {
    const user = userEvent.setup();
    const label = document.createElement('label');
    label.htmlFor = 'who';
    label.textContent = 'Name';
    document.body.append(label);
    const { container } = render(Input, { props: { id: 'who' } });
    expect(field()).toHaveAccessibleName('Name');
    await user.click(label);
    expect(document.activeElement).toBe(field());
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });

  it.each([
    ['plain', {}],
    ['with a value', { value: 'abc' }],
    ['disabled', { disabled: true }],
    ['read-only', { readonly: true }],
    ['error', { status: 'error' }],
    ['warning', { status: 'warning' }],
    ['every variant: filled', { variant: 'filled' }],
    ['every variant: underlined', { variant: 'underlined' }],
    ['with affixes, addons, clear and count', { prefix: '$', suffix: 'USD', addonBefore: 'a', addonAfter: 'b', allowClear: true, showCount: true, value: 'x' }]
  ] as Array<[string, Record<string, unknown>]>)('a11y: has no axe violations: %s', async (_name, props) => {
    const { container } = render(Input, { props: { ...named, ...props } as never });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });

  it('a11y: the field is in the Tab order once; the clear button follows it', async () => {
    const user = userEvent.setup();
    render(Input, { props: { ...named, allowClear: true, value: 'x' } });
    await user.tab();
    expect(document.activeElement).toBe(field());
    await user.tab();
    expect(document.activeElement).toBe(clearButton());
  });
});

describe('Input: the event that onchange receives in an IME composition', () => {
  // Chromium fires the last `input` before `compositionend`, Firefox fires `compositionend` first. Either way the
  // text is taken once and `onchange` is called once per edit; only the event it gets differs.
  it('the last input comes before compositionend: onchange gets the input events, and compositionend adds nothing', async () => {
    const onchange = vi.fn();
    render(Input, { props: { ...named, onchange } });
    await fireEvent.compositionStart(field());
    await fireEvent.input(field(), { target: { value: 'a' } });
    await fireEvent.input(field(), { target: { value: 'ab' } });
    await fireEvent.compositionEnd(field());
    expect(onchange).toHaveBeenCalledTimes(2);
    expect(onchange.mock.calls.map(([value]) => value)).toEqual(['a', 'ab']);
    expect(onchange.mock.calls.map(([, event]) => (event as Event).type)).toEqual(['input', 'input']);
  });

  it('compositionend comes before the last input (Firefox): onchange is called once, with the compositionend event', async () => {
    const onchange = vi.fn();
    render(Input, { props: { ...named, onchange } });
    await fireEvent.compositionStart(field());
    field().value = 'Ada';
    await fireEvent.compositionEnd(field());
    await fireEvent.input(field());
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledWith('Ada', expect.objectContaining({ type: 'compositionend' }));
    expect(field().value).toBe('Ada');
  });
});
