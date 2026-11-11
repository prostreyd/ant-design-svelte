import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InputSearch from '../src/lib/Input/InputSearch.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
});

const named = { 'aria-label': 'Search products' };
const field = () => screen.getByRole('searchbox') as HTMLInputElement;
const wrapper = () => field().closest('.ads-input-search') as HTMLElement;
const root = () => field().closest('.ads-input') as HTMLElement;
const iconButton = () => root().querySelector('.ads-input-search-icon') as HTMLButtonElement | null;
const enterButton = () => wrapper().querySelector('.ads-input-search-button') as HTMLButtonElement | null;
const clearButton = () => root().querySelector('.ads-input-clear') as HTMLButtonElement | null;
const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('InputSearch', () => {
  // --- Rendering ---

  it('default: a search input with the search icon as a named button inside the field', () => {
    render(InputSearch, { props: named });
    expect(field()).toHaveAttribute('type', 'search');
    expect(wrapper()).toHaveClass('ads-input-search');
    expect(wrapper()).not.toHaveClass('ads-input-search-with-button');
    expect(iconButton()!.tagName).toBe('BUTTON');
    expect(iconButton()).toHaveAttribute('type', 'button');
    expect(iconButton()).toHaveAttribute('aria-label', 'Search');
    expect(iconButton()!.closest('.ads-input-suffix')).not.toBeNull();
    expect(iconButton()!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(enterButton()).toBeNull();
  });

  it('type: a consumer type replaces the default search type', () => {
    render(InputSearch, { props: { ...named, type: 'text' } });
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  // --- onsearch ---

  it('onsearch: a click on the icon calls it with the text, the event and source "input"', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, value: 'cats', onsearch } });
    await user.click(iconButton()!);
    expect(onsearch).toHaveBeenCalledTimes(1);
    expect(onsearch).toHaveBeenCalledWith('cats', expect.any(MouseEvent), { source: 'input' });
  });

  it('onsearch: Enter calls it with the keyboard event; onpressenter also runs, first', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onsearch = vi.fn(() => calls.push('search'));
    const onpressenter = vi.fn(() => calls.push('enter'));
    render(InputSearch, { props: { ...named, onsearch, onpressenter } });
    await user.type(field(), 'dogs{Enter}');
    expect(onsearch).toHaveBeenCalledTimes(1);
    expect(onsearch).toHaveBeenCalledWith('dogs', expect.any(KeyboardEvent), { source: 'input' });
    expect(calls).toEqual(['enter', 'search']);
  });

  it('onsearch: typing alone does not search', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, onsearch } });
    await user.type(field(), 'abc');
    expect(onsearch).not.toHaveBeenCalled();
  });

  it('onsearch: the clear button searches with an empty text and source "clear"; onclear runs first', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onsearch = vi.fn(() => calls.push('search'));
    const onclear = vi.fn(() => calls.push('clear'));
    render(FieldHarness, { props: { component: InputSearch, initial: 'cats', allowClear: true, onsearch, onclear, ...named } });
    await user.click(clearButton()!);
    expect(onsearch).toHaveBeenCalledWith('', expect.any(MouseEvent), { source: 'clear' });
    expect(calls).toEqual(['clear', 'search']);
    expect(screen.getByTestId('parent-value')).toHaveTextContent('');
  });

  it('onsearch: an Enter while an IME composition is open does not search', async () => {
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, onsearch } });
    await fireEvent.compositionStart(field());
    await fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onsearch).not.toHaveBeenCalled();
    await fireEvent.compositionEnd(field());
    await fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onsearch).toHaveBeenCalledTimes(1);
  });

  it('onsearch: works without a handler', async () => {
    const user = userEvent.setup();
    render(InputSearch, { props: named });
    await user.type(field(), 'x{Enter}');
    await user.click(iconButton()!);
    expect(field()).toHaveValue('x');
  });

  // --- loading ---

  it('loading: the spinner replaces the icon, the button is busy, and Enter and clicks are ignored', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, loading: true, value: 'x', onsearch } });
    expect(iconButton()!.querySelector('.ads-input-icon-loading')).not.toBeNull();
    expect(iconButton()!.querySelector('.ads-input-icon-search')).toBeNull();
    expect(iconButton()).toHaveAttribute('aria-busy', 'true');
    expect(iconButton()).not.toBeDisabled();
    await user.click(iconButton()!);
    await user.click(field());
    await user.keyboard('{Enter}');
    expect(onsearch).not.toHaveBeenCalled();
  });

  it('loading: ending it brings the icon back and searching works again', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    const { rerender } = render(InputSearch, { props: { ...named, loading: true, onsearch } });
    await rerender({ loading: false });
    expect(iconButton()!.querySelector('.ads-input-icon-search')).not.toBeNull();
    expect(iconButton()).not.toHaveAttribute('aria-busy');
    await user.click(iconButton()!);
    expect(onsearch).toHaveBeenCalledTimes(1);
  });

  it('disabled: the field and the icon button are disabled and nothing searches', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, disabled: true, onsearch } });
    expect(field()).toBeDisabled();
    expect(iconButton()).toBeDisabled();
    await user.click(iconButton()!);
    expect(onsearch).not.toHaveBeenCalled();
  });

  // --- enterButton ---

  it('enterButton: true is a primary button after the field with the icon and the name "Search"', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, enterButton: true, value: 'cats', onsearch } });
    expect(wrapper()).toHaveClass('ads-input-search-with-button');
    expect(enterButton()).toHaveClass('ads-btn', 'ads-btn-primary');
    expect(enterButton()).toHaveAttribute('aria-label', 'Search');
    expect(enterButton()!.querySelector('svg')).not.toBeNull();
    expect(iconButton()).toBeNull();
    expect(root()).toHaveClass('ads-input-has-addon-after');
    expect(wrapper().lastElementChild).toBe(enterButton());
    await user.click(enterButton()!);
    expect(onsearch).toHaveBeenCalledWith('cats', expect.any(MouseEvent), { source: 'input' });
  });

  it('enterButton: a string is the button text and its name', () => {
    render(InputSearch, { props: { ...named, enterButton: 'Go' } });
    expect(enterButton()).toHaveTextContent('Go');
    expect(enterButton()).not.toHaveAttribute('aria-label');
    expect(enterButton()!.querySelector('svg')).toBeNull();
  });

  it('enterButton: a snippet is the button content', () => {
    render(InputSearch, { props: { ...named, enterButton: text('Find') } });
    expect(enterButton()!.querySelector('b')).toHaveTextContent('Find');
  });

  it('enterButton: false (the default) and an empty string add no button', () => {
    const { unmount } = render(InputSearch, { props: { ...named, enterButton: false } });
    expect(enterButton()).toBeNull();
    unmount();
    render(InputSearch, { props: { ...named, enterButton: '' } });
    expect(enterButton()).toBeNull();
    expect(iconButton()).not.toBeNull();
  });

  it('enterButton: loading puts the spinner in place of the icon, marks the button busy and ignores a click', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, enterButton: true, loading: true, onsearch } });
    expect(enterButton()!.querySelector('.ads-input-icon-loading')).not.toBeNull();
    expect(enterButton()!.querySelector('.ads-input-icon-search')).toBeNull();
    expect(enterButton()).toHaveAttribute('aria-busy', 'true');
    // The button does not use the loading of Button: its own spinner would make the button wider.
    expect(enterButton()).not.toHaveClass('ads-btn-loading');
    expect(enterButton()!.querySelector('.ads-btn-loading-icon')).toBeNull();
    await user.click(enterButton()!);
    expect(onsearch).not.toHaveBeenCalled();
  });

  it('enterButton: loading with a text puts the spinner over the text, which stays (name and width)', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    const { rerender } = render(InputSearch, { props: { ...named, enterButton: 'Search', onsearch } });
    expect(enterButton()!.querySelector('.ads-input-icon-loading')).toBeNull();
    expect(enterButton()!.querySelector('.ads-input-search-content')).not.toHaveClass('ads-input-search-content-busy');
    await rerender({ loading: true });
    expect(enterButton()!.querySelector('.ads-input-icon-loading')).not.toBeNull();
    expect(enterButton()!.querySelector('.ads-input-search-content')).toHaveClass('ads-input-search-content-busy');
    expect(enterButton()).toHaveTextContent('Search');
    expect(enterButton()).toHaveAccessibleName('Search');
    expect(enterButton()).toHaveAttribute('aria-busy', 'true');
    await user.click(enterButton()!);
    expect(onsearch).not.toHaveBeenCalled();
    await rerender({ loading: false });
    expect(enterButton()!.querySelector('.ads-input-icon-loading')).toBeNull();
    expect(enterButton()).not.toHaveAttribute('aria-busy');
  });

  it('enterButton: disabled disables the button', () => {
    render(InputSearch, { props: { ...named, enterButton: true, disabled: true } });
    expect(enterButton()).toBeDisabled();
  });

  it.each([
    ['large', 'ads-btn-large'],
    ['small', 'ads-btn-small'],
    ['medium', 'ads-btn-middle'],
    ['middle', 'ads-btn-middle'],
    ['default', 'ads-btn-middle']
  ] as const)('enterButton: size %s gives the button class %s', (size, expected) => {
    render(InputSearch, { props: { ...named, enterButton: true, size } });
    expect(enterButton()).toHaveClass(expected);
    expect(root()).toHaveClass(size === 'large' ? 'ads-input-large' : size === 'small' ? 'ads-input-small' : 'ads-input-medium');
  });

  it('enterButton with addonAfter: throws outside production; the button wins in production', () => {
    expect(() => render(InputSearch, { props: { ...named, enterButton: true, addonAfter: 'x' } })).toThrow(TypeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(InputSearch, { props: { ...named, enterButton: true, addonAfter: 'x' } });
    expect(enterButton()).not.toBeNull();
    expect(document.querySelector('.ads-input-search .ads-input-addon')).toBeNull();
  });

  it('addonAfter: without the button it is rendered as in Input', () => {
    render(InputSearch, { props: { ...named, addonAfter: '.com' } });
    expect(document.querySelector('.ads-input-search .ads-input-group > .ads-input-addon-after')).toHaveTextContent('.com');
  });

  // --- searchIcon ---

  it('searchIcon: text or a snippet replaces the icon, inside the field and on the button', () => {
    const { unmount } = render(InputSearch, { props: { ...named, searchIcon: 'Q' } });
    expect(iconButton()).toHaveTextContent('Q');
    expect(iconButton()!.querySelector('svg')).toBeNull();
    unmount();
    const second = render(InputSearch, { props: { ...named, searchIcon: text('lens') } });
    expect(iconButton()!.querySelector('b')).toHaveTextContent('lens');
    second.unmount();
    render(InputSearch, { props: { ...named, searchIcon: text('lens'), enterButton: true } });
    expect(enterButton()!.querySelector('b')).toHaveTextContent('lens');
  });

  // --- Input props, parts ---

  it('value: bind:value follows typing; a function binding that refuses an edit puts the text back', async () => {
    const user = userEvent.setup();
    const { unmount } = render(FieldHarness, { props: { component: InputSearch, ...named } });
    await user.type(field(), 'ab');
    expect(screen.getByTestId('parent-value')).toHaveTextContent('ab');
    unmount();
    render(FieldHarness, { props: { component: InputSearch, mode: 'confirm', allow: false, initial: 'ok', ...named } });
    await user.type(field(), 'x');
    expect(field()).toHaveValue('ok');
  });

  it('the props of Input work: status, variant, prefix, showCount, readonly', () => {
    render(InputSearch, { props: { ...named, status: 'warning', variant: 'filled', prefix: '#', showCount: true, readonly: true, value: 'ab' } });
    expect(root()).toHaveClass('ads-input-status-warning', 'ads-input-filled');
    expect(root().querySelector('.ads-input-prefix')).toHaveTextContent('#');
    expect(root().querySelector('.ads-input-count')).toHaveTextContent('2');
    expect(field()).toHaveAttribute('readonly');
  });

  it('suffix: a snippet suffix comes before the search icon as well', () => {
    render(InputSearch, { props: { ...named, suffix: text('kg') } });
    const suffix = root().querySelector('.ads-input-suffix')!;
    expect(suffix.querySelector('b')).toHaveTextContent('kg');
    expect(suffix.lastElementChild).toBe(iconButton());
  });

  it('onsearch: a text that is not a string (null, from a loose caller) is searched as an empty one', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(InputSearch, { props: { ...named, value: null as unknown as string, onsearch } });
    await user.click(iconButton()!);
    expect(onsearch).toHaveBeenCalledWith('', expect.any(MouseEvent), { source: 'input' });
  });

  it('suffix: a consumer suffix comes before the search icon', () => {
    render(InputSearch, { props: { ...named, suffix: 'x' } });
    const suffix = root().querySelector('.ads-input-suffix')!;
    expect(suffix).toHaveTextContent('x');
    expect(suffix.lastElementChild).toBe(iconButton());
  });

  it('classNames and styles: root and button go to the wrapper and the button; the other parts reach the input', () => {
    render(InputSearch, {
      props: {
        ...named,
        enterButton: true,
        value: 'a',
        allowClear: true,
        showCount: true,
        prefix: 'p',
        class: 'mine',
        style: 'margin: 2px',
        classNames: { root: 'c-root', button: 'c-button', input: 'c-input', prefix: 'c-prefix', clear: 'c-clear', count: 'c-count' },
        styles: { root: { color: 'red' }, button: { 'margin-top': '3px' }, input: { 'font-weight': 'bold' }, count: { 'letter-spacing': '2px' } }
      }
    });
    expect(wrapper()).toHaveClass('mine', 'c-root');
    expect(wrapper().style.margin).toBe('2px');
    expect(wrapper().style.color).toBe('red');
    expect(enterButton()).toHaveClass('c-button');
    expect(enterButton()!.style.marginTop).toBe('3px');
    expect(enterButton()!.style.getPropertyValue('border-start-start-radius')).toBe('0px');
    expect(field()).toHaveClass('c-input');
    expect(field().style.fontWeight).toBe('bold');
    expect(root().querySelector('.ads-input-prefix')).toHaveClass('c-prefix');
    expect(clearButton()).toHaveClass('c-clear');
    expect((root().querySelector('.ads-input-count') as HTMLElement).style.letterSpacing).toBe('2px');
  });

  it('focus() and blur(): move focus to the input and away', () => {
    const { component } = render(InputSearch, { props: { ...named, value: 'hello' } });
    const methods = component as unknown as { focus(options?: { cursor?: 'all' }): void; blur(): void };
    methods.focus({ cursor: 'all' });
    expect(document.activeElement).toBe(field());
    expect([field().selectionStart, field().selectionEnd]).toEqual([0, 5]);
    methods.blur();
    expect(document.activeElement).not.toBe(field());
  });

  it('a press on the icon button does not take focus from the field', async () => {
    const user = userEvent.setup();
    render(InputSearch, { props: named });
    await user.click(field());
    await user.click(iconButton()!);
    expect(document.activeElement).toBe(field());
  });

  it('onchange: once per edit with the new text and the native input event', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn<(value: string, event: Event) => void>();
    render(InputSearch, { props: { ...named, onchange } });
    await user.type(field(), 'ab');
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['a', 'ab']);
    expect(onchange.mock.calls[0][1].type).toBe('input');
  });

  it('maxlength: the native limit holds while typing', async () => {
    const user = userEvent.setup();
    render(InputSearch, { props: { ...named, maxlength: 3 } });
    await user.type(field(), 'abcdef');
    expect(field()).toHaveValue('abc');
  });

  it('allowClear: the object form (label, tab index, icon) reaches the clear button', () => {
    render(InputSearch, { props: { ...named, value: 'a', allowClear: { label: 'Erase', tabIndex: -1, clearIcon: 'x' } } });
    expect(clearButton()).toHaveAttribute('aria-label', 'Erase');
    expect(clearButton()).toHaveAttribute('tabindex', '-1');
    expect(clearButton()).toHaveTextContent('x');
  });

  it('native attributes: placeholder, id, required, aria-describedby and the oninput, onkeydown, onfocus and onblur handlers reach the input', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    const onkeydown = vi.fn();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    const onsearch = vi.fn();
    render(InputSearch, {
      props: { ...named, placeholder: 'Find', id: 'q', required: true, 'aria-describedby': 'hint', oninput, onkeydown, onfocus, onblur, onsearch }
    });
    expect(field()).toHaveAttribute('placeholder', 'Find');
    expect(field()).toHaveAttribute('id', 'q');
    expect(field()).toBeRequired();
    expect(field()).toHaveAttribute('aria-describedby', 'hint');
    await user.type(field(), 'a');
    expect(onfocus).toHaveBeenCalledTimes(1);
    expect(oninput).toHaveBeenCalledTimes(1);
    expect(onkeydown).toHaveBeenCalledTimes(1);
    expect(onsearch).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onkeydown).toHaveBeenCalledTimes(2);
    expect(onsearch).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onblur).toHaveBeenCalledTimes(1);
  });

  it('focus({ preventScroll }): is passed to the browser', () => {
    const { component } = render(InputSearch, { props: named });
    const spy = vi.spyOn(field(), 'focus');
    (component as unknown as { focus(options?: { preventScroll?: boolean }): void }).focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
  });

  // --- a11y ---

  it('a11y: reports a missing accessible name', async () => {
    const { container } = render(InputSearch);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('label');
  });

  it.each([
    ['plain', {}],
    ['loading', { loading: true }],
    ['disabled', { disabled: true }],
    ['with an icon button', { enterButton: true }],
    ['with a text button', { enterButton: 'Search' }],
    ['loading with a button', { enterButton: true, loading: true }],
    ['with clear', { allowClear: true, value: 'x' }]
  ])('a11y: has no axe violations: %s', async (_name, props) => {
    const { container } = render(InputSearch, { props: { ...named, ...props } });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
