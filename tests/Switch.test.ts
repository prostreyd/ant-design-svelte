import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Switch from '../src/lib/Switch/Switch.svelte';
import SwitchHarness from './fixtures/SwitchHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('form').forEach((form) => form.remove());
});

const named = { 'aria-label': 'Wi-Fi' };
const sw = () => screen.getByRole('switch');
const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));
const parentValue = () => screen.getByTestId('parent-value').textContent;
/** The component's own classes; Svelte adds a generated scoping class that tests ignore. */
const appClasses = (element: Element | null) =>
  [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
/** The mounted contents of the on and off states, in the order of the DOM. */
const contentItems = () => [...sw().querySelectorAll('.ads-switch-content-item')];
const isHiddenItem = (item: Element) => item.classList.contains('ads-switch-content-hidden');
/** The text of the content that is shown; the content of the other state is mounted but hidden. */
const shownText = () =>
  contentItems()
    .filter((item) => !isHiddenItem(item))
    .map((item) => item.textContent?.trim())
    .join('');
const hiddenText = () =>
  contentItems()
    .filter(isHiddenItem)
    .map((item) => item.textContent?.trim())
    .join('');
const styleOf = (element: Element | null) => (element as HTMLElement).style;

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('Switch', () => {
  // --- Rendering and defaults ---

  it('default: a native button with role switch, unchecked, medium', () => {
    render(Switch, { props: named });
    expect(sw().tagName).toBe('BUTTON');
    expect(sw()).toHaveAttribute('type', 'button');
    expect(sw()).toHaveAttribute('aria-checked', 'false');
    expect(sw()).toHaveClass('ads-switch', 'ads-switch-medium');
    expect(sw()).not.toHaveClass('ads-switch-checked');
    expect(sw()).not.toBeDisabled();
  });

  it('default: renders the content and indicator parts as aria-hidden spans', () => {
    render(Switch, { props: named });
    const parts = sw().querySelectorAll(':scope > span');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveClass('ads-switch-content');
    expect(parts[1]).toHaveClass('ads-switch-indicator');
    expect(parts[0]).toHaveAttribute('aria-hidden', 'true');
    expect(parts[1]).toHaveAttribute('aria-hidden', 'true');
  });

  // --- checked ---

  it.each([
    [true, 'true'],
    [false, 'false']
  ])('checked=%s: initial state is reflected in aria-checked', (checked, expected) => {
    render(Switch, { props: { ...named, checked } });
    expect(sw()).toHaveAttribute('aria-checked', expected);
    if (checked) expect(sw()).toHaveClass('ads-switch-checked');
  });

  it('checked: bind:checked updates the parent on a click and on a second click', async () => {
    const user = userEvent.setup();
    render(SwitchHarness, { props: named });
    await user.click(sw());
    expect(parentValue()).toBe('true');
    expect(sw()).toHaveAttribute('aria-checked', 'true');
    await user.click(sw());
    expect(parentValue()).toBe('false');
    expect(sw()).toHaveAttribute('aria-checked', 'false');
  });

  it('checked: bind:checked follows a change made by the parent', async () => {
    const user = userEvent.setup();
    render(SwitchHarness, { props: { ...named, initial: true } });
    expect(sw()).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByTestId('parent-toggle'));
    expect(sw()).toHaveAttribute('aria-checked', 'false');
  });

  it('checked: a one-way checked={value} toggles locally without changing the parent', async () => {
    const user = userEvent.setup();
    render(SwitchHarness, { props: { ...named, mode: 'plain' } });
    await user.click(sw());
    expect(sw()).toHaveAttribute('aria-checked', 'true');
    expect(parentValue()).toBe('false');
  });

  it('checked: a one-way checked={value} follows a later change of the parent', async () => {
    const user = userEvent.setup();
    render(SwitchHarness, { props: { ...named, mode: 'plain' } });
    await user.click(screen.getByTestId('parent-toggle'));
    expect(sw()).toHaveAttribute('aria-checked', 'true');
    expect(sw()).toHaveClass('ads-switch-checked');
  });

  it('checked: a non-boolean falsy value renders as unchecked', () => {
    render(Switch, { props: { ...named, checked: 0 as never } });
    expect(sw()).toHaveAttribute('aria-checked', 'false');
    expect(sw()).not.toHaveClass('ads-switch-checked');
  });

  // --- onchange ---

  it('onchange: called once per click with the new value and the click event', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { ...named, onchange } });
    await user.click(sw());
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0]).toBe(true);
    expect(onchange.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
    expect(onchange.mock.calls[0][1].type).toBe('click');
    await user.click(sw());
    expect(onchange).toHaveBeenCalledTimes(2);
    expect(onchange.mock.calls[1][0]).toBe(false);
  });

  it('onchange: is called with the value after the state flipped', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(Switch, {
      props: { ...named, onchange: () => seen.push(sw().getAttribute('aria-checked') ?? '') }
    });
    await user.click(sw());
    // The handler runs synchronously, before the DOM update, so it still sees the old attribute.
    expect(seen).toEqual(['false']);
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  it('onchange: is not called for a change of the checked prop made by the parent', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(SwitchHarness, { props: { ...named, onchange } });
    await user.click(screen.getByTestId('parent-toggle'));
    expect(sw()).toHaveAttribute('aria-checked', 'true');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('onchange: rapid repeated clicks toggle once each and call it once each', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { ...named, onchange } });
    await user.click(sw());
    await user.click(sw());
    await user.click(sw());
    expect(onchange.mock.calls.map((call) => call[0])).toEqual([true, false, true]);
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  it('onchange: a replaced callback is the one that is called', async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Switch, { props: { ...named, onchange: first } });
    await rerender({ onchange: second });
    await user.click(sw());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('onchange: works without a callback', async () => {
    const user = userEvent.setup();
    render(Switch, { props: named });
    await user.click(sw());
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  // --- Function binding: the parent decides ---

  it('function binding: a parent that refuses the change keeps the switch unchanged', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(SwitchHarness, { props: { ...named, mode: 'confirm', accept: false, onchange } });
    await user.click(sw());
    expect(parentValue()).toBe('false');
    expect(sw()).toHaveAttribute('aria-checked', 'false');
    // The callback still reports what the user asked for.
    expect(onchange.mock.calls[0][0]).toBe(true);
  });

  it('function binding: a parent that accepts the change toggles the switch', async () => {
    const user = userEvent.setup();
    render(SwitchHarness, { props: { ...named, mode: 'confirm', accept: true } });
    await user.click(sw());
    expect(parentValue()).toBe('true');
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  // --- onclick ---

  it('onclick: called once per click with the native event, before the state flips', async () => {
    const user = userEvent.setup();
    const states: Array<string | null> = [];
    const onclick = vi.fn((event: MouseEvent) =>
      states.push((event.currentTarget as HTMLElement).getAttribute('aria-checked'))
    );
    render(Switch, { props: { ...named, onclick } });
    await user.click(sw());
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onclick.mock.calls[0]).toHaveLength(1);
    expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(states).toEqual(['false']);
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  it('onclick: preventDefault() cancels the toggle and onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, {
      props: { ...named, onchange, onclick: (event: MouseEvent) => event.preventDefault() }
    });
    await user.click(sw());
    expect(sw()).toHaveAttribute('aria-checked', 'false');
    expect(onchange).not.toHaveBeenCalled();
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }]
  ])('onclick: not called while %s', async (_name, state) => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    render(Switch, { props: { ...named, ...state, onclick } });
    await user.click(sw());
    await fireEvent.click(sw());
    expect(onclick).not.toHaveBeenCalled();
  });

  // --- disabled ---

  it('disabled: is natively disabled and ignores clicks', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { ...named, disabled: true, onchange } });
    expect(sw()).toBeDisabled();
    expect(sw()).toHaveClass('ads-switch-disabled');
    await user.click(sw());
    await fireEvent.click(sw());
    expect(onchange).not.toHaveBeenCalled();
    expect(sw()).toHaveAttribute('aria-checked', 'false');
  });

  it('disabled: is not in the Tab order', async () => {
    const user = userEvent.setup();
    render(Switch, { props: { ...named, disabled: true } });
    await user.tab();
    expect(sw()).not.toHaveFocus();
  });

  it('disabled: with loading it stays natively disabled and is not aria-disabled', () => {
    render(Switch, { props: { ...named, disabled: true, loading: true } });
    expect(sw()).toBeDisabled();
    expect(sw()).not.toHaveAttribute('aria-disabled');
    expect(sw()).toHaveAttribute('aria-busy', 'true');
  });

  it('disabled: can be turned off again', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const { rerender } = render(Switch, { props: { ...named, disabled: true, onchange } });
    await rerender({ disabled: false });
    expect(sw()).not.toBeDisabled();
    expect(sw()).not.toHaveClass('ads-switch-disabled');
    await user.click(sw());
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  // --- loading ---

  it('loading: shows a spinner in the handle, aria-busy and aria-disabled, not natively disabled', () => {
    render(Switch, { props: { ...named, loading: true } });
    expect(sw().querySelector('.ads-switch-indicator .ads-switch-spinner')).toBeInTheDocument();
    expect(sw()).toHaveClass('ads-switch-loading');
    expect(sw()).toHaveAttribute('aria-busy', 'true');
    expect(sw()).toHaveAttribute('aria-disabled', 'true');
    expect(sw()).not.toBeDisabled();
  });

  it('loading: without loading there is no spinner and no busy or disabled state', () => {
    render(Switch, { props: named });
    expect(sw().querySelector('.ads-switch-spinner')).not.toBeInTheDocument();
    expect(sw()).not.toHaveAttribute('aria-busy');
    expect(sw()).not.toHaveAttribute('aria-disabled');
  });

  it('loading: does not change the state or call onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { ...named, loading: true, onchange } });
    await user.click(sw());
    await fireEvent.click(sw());
    expect(onchange).not.toHaveBeenCalled();
    expect(sw()).toHaveAttribute('aria-checked', 'false');
  });

  it('loading: keeps focus when it starts and stays in the Tab order', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Switch, { props: named });
    await user.tab();
    expect(sw()).toHaveFocus();
    await rerender({ loading: true });
    expect(sw()).toHaveFocus();
    await user.tab({ shift: true });
    await user.tab();
    expect(sw()).toHaveFocus();
  });

  it('loading: ignores Enter and Space', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { ...named, loading: true, onchange } });
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onchange).not.toHaveBeenCalled();
    expect(sw()).toHaveAttribute('aria-checked', 'false');
  });

  it('loading: toggling works again after it ends', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Switch, { props: { ...named, loading: true } });
    await rerender({ loading: false });
    expect(sw().querySelector('.ads-switch-spinner')).not.toBeInTheDocument();
    expect(sw()).not.toHaveAttribute('aria-busy');
    await user.click(sw());
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  it('loading: a consumer aria-busy and aria-disabled are kept when not loading and overridden when loading', async () => {
    const { rerender } = render(Switch, {
      props: { ...named, 'aria-busy': true, 'aria-disabled': true }
    });
    expect(sw()).toHaveAttribute('aria-busy', 'true');
    expect(sw()).toHaveAttribute('aria-disabled', 'true');
    await rerender({ 'aria-busy': false, 'aria-disabled': false });
    expect(sw()).toHaveAttribute('aria-busy', 'false');
    expect(sw()).toHaveAttribute('aria-disabled', 'false');
    await rerender({ loading: true });
    expect(sw()).toHaveAttribute('aria-busy', 'true');
    expect(sw()).toHaveAttribute('aria-disabled', 'true');
  });

  // --- Keyboard ---

  it('keyboard: Tab reaches the switch, Enter and Space toggle it', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { ...named, onchange } });
    await user.tab();
    expect(sw()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(sw()).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(sw()).toHaveAttribute('aria-checked', 'false');
    expect(onchange.mock.calls.map((call) => call[0])).toEqual([true, false]);
  });

  it.each(['{ArrowLeft}', '{ArrowRight}', '{ArrowUp}', '{ArrowDown}', 'a', '{Escape}'])(
    'keyboard: %s does not change the state',
    async (key) => {
      const user = userEvent.setup();
      const onchange = vi.fn();
      render(Switch, { props: { ...named, onchange } });
      await user.tab();
      await user.keyboard(key);
      expect(onchange).not.toHaveBeenCalled();
      expect(sw()).toHaveAttribute('aria-checked', 'false');
    }
  );

  it('keyboard: Shift+Tab moves focus away', async () => {
    const user = userEvent.setup();
    render(Switch, { props: named });
    await user.tab();
    await user.tab({ shift: true });
    expect(sw()).not.toHaveFocus();
  });

  it('forms: does not submit a surrounding form', async () => {
    const user = userEvent.setup();
    const onsubmit = vi.fn((event: Event) => event.preventDefault());
    const form = document.createElement('form');
    form.addEventListener('submit', onsubmit);
    document.body.append(form);
    render(Switch, { target: form, props: named });
    await user.click(sw());
    await user.keyboard('{Enter}');
    expect(onsubmit).not.toHaveBeenCalled();
  });

  // --- size ---

  it.each([
    ['medium', 'ads-switch-medium'],
    ['default', 'ads-switch-medium'],
    ['small', 'ads-switch-small']
  ] as const)('size=%s applies the class %s', (size, expectedClass) => {
    render(Switch, { props: { ...named, size } });
    expect(sw()).toHaveClass(expectedClass);
    const other = expectedClass === 'ads-switch-small' ? 'ads-switch-medium' : 'ads-switch-small';
    expect(sw()).not.toHaveClass(other);
  });

  it('size: changing it re-renders the class', async () => {
    const { rerender } = render(Switch, { props: named });
    await rerender({ size: 'small' });
    expect(sw()).toHaveClass('ads-switch-small');
    await rerender({ size: 'default' });
    expect(sw()).toHaveClass('ads-switch-medium');
  });

  it('size: an invalid value throws a RangeError outside production', () => {
    let caught: unknown;
    try {
      render(Switch, { props: { ...named, size: 'large' as never } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RangeError);
    expect((caught as Error).message).toContain('Switch size must be one of: medium, small, default.');
  });

  it('size: an invalid value falls back to medium in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(Switch, { props: { ...named, size: 'large' as never } });
    expect(sw()).toHaveClass('ads-switch-medium');
  });

  // --- checkedChildren / unCheckedChildren ---

  it('children: both contents are mounted and only the one of the current state is shown', async () => {
    const user = userEvent.setup();
    render(Switch, {
      props: { ...named, checkedChildren: text('On'), unCheckedChildren: text('Off') }
    });
    expect(contentItems()).toHaveLength(2);
    expect(shownText()).toBe('Off');
    expect(hiddenText()).toBe('On');
    await user.click(sw());
    expect(shownText()).toBe('On');
    expect(hiddenText()).toBe('Off');
    await user.click(sw());
    expect(shownText()).toBe('Off');
  });

  it('children: both contents share one parent, the content part, so the width follows the wider one', () => {
    render(Switch, {
      props: { ...named, checkedChildren: text('Happy'), unCheckedChildren: text('Sad') }
    });
    const parents = new Set(contentItems().map((item) => item.parentElement));
    expect(parents.size).toBe(1);
    expect([...parents][0]).toBe(sw().querySelector('.ads-switch-content'));
  });

  it('children: only checkedChildren is mounted once and is hidden while unchecked', async () => {
    const user = userEvent.setup();
    render(Switch, { props: { ...named, checkedChildren: text('On') } });
    expect(contentItems()).toHaveLength(1);
    expect(shownText()).toBe('');
    expect(hiddenText()).toBe('On');
    await user.click(sw());
    expect(shownText()).toBe('On');
    expect(hiddenText()).toBe('');
  });

  it('children: only unCheckedChildren is mounted once and is hidden while checked', async () => {
    const user = userEvent.setup();
    render(Switch, { props: { ...named, unCheckedChildren: text('Off') } });
    expect(contentItems()).toHaveLength(1);
    expect(shownText()).toBe('Off');
    expect(hiddenText()).toBe('');
    await user.click(sw());
    expect(shownText()).toBe('');
    expect(hiddenText()).toBe('Off');
  });

  it('children: initially checked shows the checked content', () => {
    render(Switch, {
      props: { ...named, checked: true, checkedChildren: text('On'), unCheckedChildren: text('Off') }
    });
    expect(shownText()).toBe('On');
    expect(hiddenText()).toBe('Off');
  });

  it('children: without snippets there is nothing in the content part', () => {
    render(Switch, { props: named });
    expect(contentItems()).toHaveLength(0);
    expect(sw().querySelector('.ads-switch-content')?.textContent?.trim()).toBe('');
  });

  it('children: are inside the aria-hidden content part and do not name the switch', () => {
    render(Switch, { props: { checkedChildren: text('On'), unCheckedChildren: text('Off') } });
    const content = sw().querySelector('.ads-switch-content');
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(shownText()).toBe('Off');
    expect(screen.queryByRole('switch', { name: 'Off' })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'On' })).not.toBeInTheDocument();
  });

  it('children: a change of the snippet is rendered', async () => {
    const { rerender } = render(Switch, { props: { ...named, unCheckedChildren: text('Off') } });
    await rerender({ unCheckedChildren: text('Disabled') });
    expect(shownText()).toBe('Disabled');
  });

  // --- checkedChildren / unCheckedChildren as plain strings ---

  it('children as strings: shown in their own state and hidden in the other', async () => {
    const user = userEvent.setup();
    render(Switch, { props: { ...named, checkedChildren: 'On', unCheckedChildren: 'Off' } });
    expect(contentItems()).toHaveLength(2);
    expect(shownText()).toBe('Off');
    expect(hiddenText()).toBe('On');
    await user.click(sw());
    expect(shownText()).toBe('On');
    expect(hiddenText()).toBe('Off');
  });

  it('children as strings: initially checked shows the checked string', () => {
    render(Switch, {
      props: { ...named, checked: true, checkedChildren: 'On', unCheckedChildren: 'Off' }
    });
    expect(shownText()).toBe('On');
  });

  it('children as strings: a string is text, not HTML', () => {
    render(Switch, {
      props: { ...named, checkedChildren: '<b>On</b>', unCheckedChildren: 'a & b <i>x</i>' }
    });
    expect(sw().querySelector('.ads-switch-content b')).not.toBeInTheDocument();
    expect(sw().querySelector('.ads-switch-content i')).not.toBeInTheDocument();
    expect(hiddenText()).toBe('<b>On</b>');
    expect(shownText()).toBe('a & b <i>x</i>');
  });

  it('children as strings: an empty string renders nothing', () => {
    render(Switch, { props: { ...named, checkedChildren: '', unCheckedChildren: 'Off' } });
    expect(contentItems()).toHaveLength(1);
    expect(shownText()).toBe('Off');
  });

  it('children as strings: both empty render nothing at all', () => {
    render(Switch, { props: { ...named, checkedChildren: '', unCheckedChildren: '' } });
    expect(contentItems()).toHaveLength(0);
  });

  it('children as strings: a string and a snippet can be mixed', async () => {
    const user = userEvent.setup();
    render(Switch, { props: { ...named, checkedChildren: text('Icon'), unCheckedChildren: 'Off' } });
    expect(shownText()).toBe('Off');
    expect(hiddenText()).toBe('Icon');
    expect(sw().querySelector('.ads-switch-content b')).toHaveTextContent('Icon');
    await user.click(sw());
    expect(shownText()).toBe('Icon');
    expect(hiddenText()).toBe('Off');
  });

  it('children as strings: a changed string is rendered', async () => {
    const { rerender } = render(Switch, { props: { ...named, unCheckedChildren: 'Off' } });
    await rerender({ unCheckedChildren: 'Disabled' });
    expect(shownText()).toBe('Disabled');
  });

  it('children as strings: a string can be replaced by a snippet and back', async () => {
    const { rerender } = render(Switch, { props: { ...named, unCheckedChildren: 'Off' } });
    await rerender({ unCheckedChildren: text('Snippet') });
    expect(sw().querySelector('.ads-switch-content b')).toHaveTextContent('Snippet');
    await rerender({ unCheckedChildren: 'Text again' });
    expect(sw().querySelector('.ads-switch-content b')).not.toBeInTheDocument();
    expect(shownText()).toBe('Text again');
  });

  it('children as strings: are aria-hidden and do not name the switch', () => {
    render(Switch, { props: { checkedChildren: 'On', unCheckedChildren: 'Off' } });
    expect(sw().querySelector('.ads-switch-content')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('switch', { name: 'Off' })).not.toBeInTheDocument();
  });

  // --- classNames / class ---

  it('classNames: each part gets its class and keeps the component classes', () => {
    render(Switch, {
      props: {
        ...named,
        classNames: { root: 'r-extra', content: 'c-extra', indicator: 'i-extra' }
      }
    });
    expect(sw()).toHaveClass('ads-switch', 'r-extra');
    expect(sw().querySelector('.ads-switch-content')).toHaveClass('ads-switch-content', 'c-extra');
    expect(sw().querySelector('.ads-switch-indicator')).toHaveClass(
      'ads-switch-indicator',
      'i-extra'
    );
  });

  it('classNames: an omitted part gets no extra class', () => {
    render(Switch, { props: { ...named, classNames: { content: 'only-content' } } });
    expect(appClasses(sw())).toEqual(['ads-switch', 'ads-switch-medium']);
    expect(appClasses(sw().querySelector('.ads-switch-indicator'))).toEqual([
      'ads-switch-indicator'
    ]);
    expect(sw().className).not.toContain('only-content');
  });

  it('class: is appended together with classNames.root', () => {
    render(Switch, { props: { ...named, class: 'mine', classNames: { root: 'theirs' } } });
    expect(sw()).toHaveClass('ads-switch', 'mine', 'theirs');
  });

  it('classNames: a change is applied reactively and removed when cleared', async () => {
    const { rerender } = render(Switch, { props: { ...named, classNames: { root: 'a' } } });
    expect(sw()).toHaveClass('a');
    await rerender({ classNames: { root: 'b' } });
    expect(sw()).toHaveClass('b');
    expect(sw()).not.toHaveClass('a');
    await rerender({ classNames: undefined });
    expect(sw()).not.toHaveClass('b');
  });

  // --- styles ---

  it('styles: each part gets its inline style', () => {
    render(Switch, {
      props: {
        ...named,
        styles: {
          root: { 'background-color': 'red' },
          content: { 'padding-inline': '4px' },
          indicator: { 'box-shadow': 'none' }
        }
      }
    });
    expect(styleOf(sw()).backgroundColor).toBe('red');
    expect(styleOf(sw().querySelector('.ads-switch-content')).paddingInline).toBe('4px');
    expect(styleOf(sw().querySelector('.ads-switch-indicator')).boxShadow).toBe('none');
  });

  it('styles: kebab-case names and custom properties are written as given, numbers as-is', () => {
    render(Switch, {
      props: { ...named, styles: { root: { '--my-var': 3, opacity: 0.5, 'z-index': 2 } } }
    });
    expect(styleOf(sw()).getPropertyValue('--my-var')).toBe('3');
    expect(styleOf(sw()).opacity).toBe('0.5');
    expect(styleOf(sw()).zIndex).toBe('2');
  });

  it('styles: empty values are skipped', () => {
    render(Switch, {
      props: { ...named, styles: { root: { opacity: 0.5, color: '', margin: undefined as never } } }
    });
    expect(styleOf(sw()).length).toBe(1);
    expect(styleOf(sw()).opacity).toBe('0.5');
  });

  it('styles: without styles there is no style attribute', () => {
    render(Switch, { props: named });
    expect(sw()).not.toHaveAttribute('style');
    expect(sw().querySelector('.ads-switch-content')).not.toHaveAttribute('style');
    expect(sw().querySelector('.ads-switch-indicator')).not.toHaveAttribute('style');
  });

  it('styles: update reactively and are removed when cleared', async () => {
    const { rerender } = render(Switch, { props: { ...named, styles: { root: { opacity: 1 } } } });
    expect(styleOf(sw()).opacity).toBe('1');
    await rerender({ styles: { root: { opacity: 0.5 } } });
    expect(styleOf(sw()).opacity).toBe('0.5');
    await rerender({ styles: undefined });
    expect(sw()).not.toHaveAttribute('style');
  });

  it('styles: the style attribute and styles.root are merged, styles.root last', () => {
    render(Switch, {
      props: { ...named, style: 'margin: 4px; opacity: 1;', styles: { root: { opacity: 0.5 } } }
    });
    expect(styleOf(sw()).margin).toBe('4px');
    // The same property twice: the later declaration, from `styles.root`, wins.
    expect(styleOf(sw()).opacity).toBe('0.5');
  });

  it('style: the style attribute alone is applied to the root', () => {
    render(Switch, { props: { ...named, style: 'margin: 4px' } });
    expect(sw().style.margin).toBe('4px');
  });

  // --- Native attributes ---

  it('native attributes: id, title, data-* and aria-* are forwarded to the button', () => {
    render(Switch, {
      props: {
        id: 'wifi',
        title: 'Toggle Wi-Fi',
        'data-testid': 'wifi-switch',
        'aria-describedby': 'hint',
        'aria-label': 'Wi-Fi'
      }
    });
    expect(sw()).toHaveAttribute('id', 'wifi');
    expect(sw()).toHaveAttribute('title', 'Toggle Wi-Fi');
    expect(sw()).toHaveAttribute('data-testid', 'wifi-switch');
    expect(sw()).toHaveAttribute('aria-describedby', 'hint');
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBe(sw());
  });

  it('native attributes: tabindex is forwarded', () => {
    render(Switch, { props: { ...named, tabindex: -1 } });
    expect(sw()).toHaveAttribute('tabindex', '-1');
  });

  it('native attributes: other handlers are forwarded', async () => {
    const user = userEvent.setup();
    const onkeydown = vi.fn();
    render(Switch, { props: { ...named, onkeydown } });
    await user.tab();
    await user.keyboard('a');
    expect(onkeydown).toHaveBeenCalledTimes(1);
  });

  it('native attributes: type, role and aria-checked belong to the component', () => {
    render(Switch, {
      props: { ...named, type: 'submit', role: 'button', 'aria-checked': 'true' } as never
    });
    expect(sw()).toHaveAttribute('type', 'button');
    expect(sw()).toHaveAttribute('role', 'switch');
    expect(sw()).toHaveAttribute('aria-checked', 'false');
  });

  // --- Methods ---

  it('focus() moves focus to the switch and blur() removes it', () => {
    const { component } = render(Switch, { props: named });
    expect(sw()).not.toHaveFocus();
    component.focus();
    expect(sw()).toHaveFocus();
    component.blur();
    expect(sw()).not.toHaveFocus();
  });

  it('focus() passes its options to the element', () => {
    const { component } = render(Switch, { props: named });
    const spy = vi.spyOn(sw(), 'focus');
    component.focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
  });

  // --- Reactivity ---

  it('reactivity: disabled, loading and checked changes update the same element', async () => {
    const { rerender } = render(Switch, { props: named });
    const element = sw();
    await rerender({ checked: true, disabled: true });
    expect(sw()).toBe(element);
    expect(element).toBeDisabled();
    expect(element).toHaveAttribute('aria-checked', 'true');
    await rerender({ disabled: false, loading: true });
    expect(element).not.toBeDisabled();
    expect(element).toHaveAttribute('aria-busy', 'true');
  });

  // --- Accessibility ---

  it('a11y: is named by aria-label, aria-labelledby and a label element', () => {
    render(Switch, { props: { 'aria-label': 'Wi-Fi' } });
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
    document.body.innerHTML = '';

    render(SwitchHarness, { props: { 'aria-labelledby': 'heading' } });
    const heading = document.createElement('span');
    heading.id = 'heading';
    heading.textContent = 'Notifications';
    document.body.append(heading);
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument();
    document.body.innerHTML = '';

    const label = document.createElement('label');
    label.htmlFor = 'sound';
    label.textContent = 'Sound';
    document.body.append(label);
    render(Switch, { props: { id: 'sound' } });
    expect(screen.getByRole('switch', { name: 'Sound' })).toBeInTheDocument();
  });

  it('a11y: clicking the label toggles the switch', async () => {
    const user = userEvent.setup();
    const label = document.createElement('label');
    label.htmlFor = 'sound';
    label.textContent = 'Sound';
    document.body.append(label);
    render(Switch, { props: { id: 'sound' } });
    await user.click(label);
    expect(sw()).toHaveAttribute('aria-checked', 'true');
  });

  it('a11y: reports a missing accessible name', async () => {
    const { container } = render(Switch);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('button-name');
  });

  it('a11y: the on/off text does not count as a name', async () => {
    const { container } = render(Switch, {
      props: { checkedChildren: text('On'), unCheckedChildren: text('Off') }
    });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('button-name');
  });

  it.each([
    ['unchecked', {}],
    ['checked', { checked: true }],
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
    ['small', { size: 'small' }],
    ['with text snippets', { checkedChildren: text('On'), unCheckedChildren: text('Off') }],
    ['with text strings', { checkedChildren: 'On', unCheckedChildren: 'Off' }]
  ])('a11y: has no axe violations when %s and named', async (_name, props) => {
    const { container } = render(Switch, { props: { ...named, ...props } as never });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
