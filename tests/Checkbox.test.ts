import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Checkbox from '../src/lib/Checkbox/Checkbox.svelte';
import CheckboxHarness from './fixtures/CheckboxHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('form, label, span').forEach((element) => {
    if (element.parentElement === document.body) element.remove();
  });
});

const named = { 'aria-label': 'Wi-Fi' };
const cb = () => screen.getByRole('checkbox') as HTMLInputElement;
const root = () => cb().closest('label') as HTMLLabelElement;
const icon = () => root().querySelector('.ads-checkbox-icon') as HTMLElement;
const labelPart = () => root().querySelector('.ads-checkbox-label') as HTMLElement | null;
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

describe('Checkbox', () => {
  // --- Rendering and defaults ---

  it('default: a native input in a label, unchecked, not indeterminate, not disabled', () => {
    render(Checkbox, { props: named });
    expect(cb().tagName).toBe('INPUT');
    expect(cb()).toHaveAttribute('type', 'checkbox');
    expect(cb()).not.toBeChecked();
    expect(cb().indeterminate).toBe(false);
    expect(cb()).not.toBeDisabled();
    expect(root().tagName).toBe('LABEL');
    expect(appClasses(root())).toEqual(['ads-checkbox']);
    expect(cb()).toHaveClass('ads-checkbox-input');
  });

  it('default: the box is an aria-hidden span next to the input, and there is no label part without children', () => {
    render(Checkbox, { props: named });
    const control = cb().parentElement as HTMLElement;
    expect(control).toHaveClass('ads-checkbox-control');
    expect(icon()).toBe(cb().nextElementSibling);
    expect(icon()).toHaveAttribute('aria-hidden', 'true');
    expect(icon().textContent).toBe('');
    expect(labelPart()).toBeNull();
  });

  // --- checked ---

  it.each([true, false])('checked=%s: the initial state is reflected by the input and the class', (checked) => {
    render(Checkbox, { props: { ...named, checked } });
    expect(cb().checked).toBe(checked);
    expect(root().classList.contains('ads-checkbox-checked')).toBe(checked);
  });

  it('checked: bind:checked updates the parent on a click and on a second click', async () => {
    const user = userEvent.setup();
    render(CheckboxHarness);
    await user.click(cb());
    expect(parentValue()).toBe('true');
    expect(cb()).toBeChecked();
    await user.click(cb());
    expect(parentValue()).toBe('false');
    expect(cb()).not.toBeChecked();
  });

  it('checked: bind:checked follows a change made by the parent', async () => {
    const user = userEvent.setup();
    render(CheckboxHarness, { props: { initial: true } });
    expect(cb()).toBeChecked();
    await user.click(screen.getByTestId('parent-toggle'));
    expect(cb()).not.toBeChecked();
    expect(root()).not.toHaveClass('ads-checkbox-checked');
  });

  it('checked: a one-way checked={value} toggles locally without changing the parent', async () => {
    const user = userEvent.setup();
    render(CheckboxHarness, { props: { mode: 'plain' } });
    await user.click(cb());
    expect(cb()).toBeChecked();
    expect(parentValue()).toBe('false');
  });

  it('checked: a one-way checked={value} follows a later change of the parent', async () => {
    const user = userEvent.setup();
    render(CheckboxHarness, { props: { mode: 'plain' } });
    await user.click(screen.getByTestId('parent-toggle'));
    expect(cb()).toBeChecked();
    expect(root()).toHaveClass('ads-checkbox-checked');
  });

  it('checked: a non-boolean falsy value renders as unchecked', () => {
    render(Checkbox, { props: { ...named, checked: 0 as never } });
    expect(cb()).not.toBeChecked();
    expect(root()).not.toHaveClass('ads-checkbox-checked');
  });

  // --- onchange ---

  it('onchange: called once per click with the new value and the native change event', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, { props: { ...named, onchange } });
    await user.click(cb());
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0]).toBe(true);
    expect(onchange.mock.calls[0][1]).toBeInstanceOf(Event);
    expect(onchange.mock.calls[0][1].type).toBe('change');
    expect(onchange.mock.calls[0][1].target).toBe(cb());
    await user.click(cb());
    expect(onchange).toHaveBeenCalledTimes(2);
    expect(onchange.mock.calls[1][0]).toBe(false);
  });

  it('onchange: the input already has the new state inside the callback', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    render(Checkbox, {
      props: { ...named, onchange: (_checked, event) => seen.push((event.target as HTMLInputElement).checked) }
    });
    await user.click(cb());
    expect(seen).toEqual([true]);
  });

  it('onchange: is not called for a change of the checked prop made by the parent', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(CheckboxHarness, { props: { onchange } });
    await user.click(screen.getByTestId('parent-toggle'));
    expect(cb()).toBeChecked();
    expect(onchange).not.toHaveBeenCalled();
  });

  it('onchange: rapid repeated clicks toggle once each and call it once each', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, { props: { ...named, onchange } });
    await user.click(cb());
    await user.click(cb());
    await user.click(cb());
    expect(onchange.mock.calls.map((call) => call[0])).toEqual([true, false, true]);
    expect(cb()).toBeChecked();
  });

  it('onchange: a replaced callback is the one that is called', async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Checkbox, { props: { ...named, onchange: first } });
    await rerender({ onchange: second });
    await user.click(cb());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('onchange: works without a callback', async () => {
    const user = userEvent.setup();
    render(Checkbox, { props: named });
    await user.click(cb());
    expect(cb()).toBeChecked();
  });

  it('onchange: a click on the label text toggles the checkbox too', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, { props: { children: text('Wi-Fi'), onchange } });
    await user.click(labelPart()!);
    expect(cb()).toBeChecked();
    expect(onchange).toHaveBeenCalledWith(true, expect.any(Event));
  });

  // --- Function binding: the parent decides ---

  it('function binding: a parent that refuses the change reverts the input', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(CheckboxHarness, { props: { mode: 'confirm', allow: false, onchange } });
    await user.click(cb());
    expect(parentValue()).toBe('false');
    expect(cb()).not.toBeChecked();
    expect(root()).not.toHaveClass('ads-checkbox-checked');
    // The callback still reports what the user asked for.
    expect(onchange.mock.calls[0][0]).toBe(true);
  });

  it('function binding: a parent that accepts the change checks the box', async () => {
    const user = userEvent.setup();
    render(CheckboxHarness, { props: { mode: 'confirm', allow: true } });
    await user.click(cb());
    expect(parentValue()).toBe('true');
    expect(cb()).toBeChecked();
  });

  // --- onclick (native, forwarded) ---

  it('onclick: a forwarded handler is called once per click with the native event, before onchange', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const onclick = vi.fn((event: MouseEvent) => {
      order.push(event.type);
      expect(event).toBeInstanceOf(MouseEvent);
    });
    render(Checkbox, { props: { ...named, onclick, onchange: () => order.push('change') } });
    await user.click(cb());
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['click', 'change']);
  });

  it('onclick: preventDefault() cancels the toggle and onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, {
      props: { ...named, onchange, onclick: (event: MouseEvent) => event.preventDefault() }
    });
    await user.click(cb());
    expect(cb()).not.toBeChecked();
    expect(onchange).not.toHaveBeenCalled();
  });

  // --- disabled ---

  it('disabled: is natively disabled and ignores clicks on the box and on the text', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, { props: { children: text('Wi-Fi'), disabled: true, onchange } });
    expect(cb()).toBeDisabled();
    expect(root()).toHaveClass('ads-checkbox-disabled');
    await user.click(cb());
    await user.click(labelPart()!);
    expect(onchange).not.toHaveBeenCalled();
    expect(cb()).not.toBeChecked();
  });

  it('disabled: is not in the Tab order', async () => {
    const user = userEvent.setup();
    render(Checkbox, { props: { ...named, disabled: true } });
    await user.tab();
    expect(cb()).not.toHaveFocus();
  });

  it('disabled: can be turned off again', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const { rerender } = render(Checkbox, { props: { ...named, disabled: true, onchange } });
    await rerender({ disabled: false });
    expect(cb()).not.toBeDisabled();
    expect(root()).not.toHaveClass('ads-checkbox-disabled');
    await user.click(cb());
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  // --- indeterminate ---

  it('indeterminate: sets the native property and the class; checked is not affected', () => {
    render(Checkbox, { props: { ...named, indeterminate: true } });
    expect(cb().indeterminate).toBe(true);
    expect(root()).toHaveClass('ads-checkbox-indeterminate');
    expect(cb()).not.toBeChecked();
    expect(root()).not.toHaveClass('ads-checkbox-checked');
  });

  it('indeterminate: is written back after a click, which the browser would clear', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, { props: { ...named, indeterminate: true, onchange } });
    await user.click(cb());
    expect(cb()).toBeChecked();
    expect(cb().indeterminate).toBe(true);
    expect(onchange).toHaveBeenCalledWith(true, expect.any(Event));
  });

  it('indeterminate: a change of the prop re-renders', async () => {
    const { rerender } = render(Checkbox, { props: { ...named, indeterminate: true } });
    await rerender({ indeterminate: false });
    expect(cb().indeterminate).toBe(false);
    expect(root()).not.toHaveClass('ads-checkbox-indeterminate');
    await rerender({ indeterminate: true });
    expect(cb().indeterminate).toBe(true);
  });

  it('indeterminate: combines with checked', () => {
    render(Checkbox, { props: { ...named, indeterminate: true, checked: true } });
    expect(cb()).toBeChecked();
    expect(cb().indeterminate).toBe(true);
    expect(root()).toHaveClass('ads-checkbox-checked', 'ads-checkbox-indeterminate');
  });

  // --- value and name ---

  it.each([
    ['a string', 'apple', 'apple'],
    ['a number', 2, '2']
  ])('value: %s is written to the input', (_name, value, expected) => {
    render(Checkbox, { props: { ...named, value } });
    expect(cb().value).toBe(expected);
  });

  it('value: without one the input keeps the native default "on"', () => {
    render(Checkbox, { props: named });
    expect(cb().value).toBe('on');
  });

  it('value: a change is rendered', async () => {
    const { rerender } = render(Checkbox, { props: { ...named, value: 'a' } });
    await rerender({ value: 'b' });
    expect(cb().value).toBe('b');
  });

  it('value: removing it puts the native default "on" back, so a form never submits an empty value', async () => {
    const { rerender } = render(Checkbox, { props: { ...named, value: 'a' } });
    await rerender({ value: undefined });
    expect(cb().value).toBe('on');
  });

  it('name: is forwarded to the input and absent when not given', async () => {
    const { rerender } = render(Checkbox, { props: { ...named, name: 'agree' } });
    expect(cb()).toHaveAttribute('name', 'agree');
    await rerender({ name: undefined });
    expect(cb()).not.toHaveAttribute('name');
  });

  // --- children ---

  it('children: is rendered in the label part and names the checkbox', () => {
    render(Checkbox, { props: { children: text('Wi-Fi') } });
    expect(labelPart()).toHaveClass('ads-checkbox-label');
    expect(labelPart()!.querySelector('b')).toHaveTextContent('Wi-Fi');
    expect(screen.getByRole('checkbox', { name: 'Wi-Fi' })).toBe(cb());
  });

  it('children: a change of the snippet is rendered', async () => {
    const { rerender } = render(Checkbox, { props: { children: text('Wi-Fi') } });
    await rerender({ children: text('Bluetooth') });
    expect(screen.getByRole('checkbox', { name: 'Bluetooth' })).toBe(cb());
  });

  // --- Keyboard ---

  it('keyboard: Tab reaches the checkbox, Space toggles it, Enter does not', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Checkbox, { props: { ...named, onchange } });
    await user.tab();
    expect(cb()).toHaveFocus();
    await user.keyboard(' ');
    expect(cb()).toBeChecked();
    await user.keyboard('{Enter}');
    expect(cb()).toBeChecked();
    await user.keyboard(' ');
    expect(cb()).not.toBeChecked();
    expect(onchange.mock.calls.map((call) => call[0])).toEqual([true, false]);
  });

  it.each(['{ArrowLeft}', '{ArrowRight}', '{ArrowUp}', '{ArrowDown}', 'a', '{Escape}'])(
    'keyboard: %s does not change the state',
    async (key) => {
      const user = userEvent.setup();
      const onchange = vi.fn();
      render(Checkbox, { props: { ...named, onchange } });
      await user.tab();
      await user.keyboard(key);
      expect(onchange).not.toHaveBeenCalled();
      expect(cb()).not.toBeChecked();
    }
  );

  it('keyboard: Shift+Tab moves focus away', async () => {
    const user = userEvent.setup();
    render(Checkbox, { props: named });
    await user.tab();
    await user.tab({ shift: true });
    expect(cb()).not.toHaveFocus();
  });

  // --- Forms ---

  it('forms: the name and value pair is submitted when checked and absent when not', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(Checkbox, { target: form, props: { ...named, name: 'fruit', value: 'apple' } });
    expect([...new FormData(form).entries()]).toEqual([]);
    await user.click(cb());
    expect([...new FormData(form).entries()]).toEqual([['fruit', 'apple']]);
  });

  it('forms: a native reset does not leave the box out of step with the state', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      render(Checkbox, { target: form, props: { ...named, checked: true, indeterminate: true } });
      await tick();
      expect(cb()).toBeChecked();
      form.reset();
      // The reset has put the input back to its default, unchecked; it leaves indeterminate alone.
      expect(cb().checked).toBe(false);
      await vi.runAllTimersAsync();
      expect(cb()).toBeChecked();
      expect(cb().indeterminate).toBe(true);
      expect(root()).toHaveClass('ads-checkbox-checked');
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: after a reset the parent resets its state and the box follows', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      render(CheckboxHarness, { target: form, props: { initial: true } });
      await tick();
      form.addEventListener('reset', () => screen.getByTestId('parent-toggle').click());
      form.reset();
      await vi.runAllTimersAsync();
      expect(parentValue()).toBe('false');
      expect(cb()).not.toBeChecked();
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: a reset after the checkbox was removed does nothing and does not throw', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      const { unmount } = render(Checkbox, { target: form, props: { ...named, checked: true } });
      await tick();
      form.reset();
      unmount();
      await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it('forms: removing the checkbox removes its reset listener', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const remove = vi.spyOn(form, 'removeEventListener');
    const { unmount } = render(Checkbox, { target: form, props: named });
    await tick();
    unmount();
    await tick();
    expect(remove).toHaveBeenCalledWith('reset', expect.any(Function));
  });

  // --- classNames / class ---

  it('classNames: each part gets its class and keeps the component classes', () => {
    render(Checkbox, {
      props: { children: text('Wi-Fi'), classNames: { root: 'r-extra', icon: 'i-extra', label: 'l-extra' } }
    });
    expect(root()).toHaveClass('ads-checkbox', 'r-extra');
    expect(icon()).toHaveClass('ads-checkbox-icon', 'i-extra');
    expect(labelPart()).toHaveClass('ads-checkbox-label', 'l-extra');
  });

  it('classNames: an omitted part gets no extra class', () => {
    render(Checkbox, { props: { children: text('Wi-Fi'), classNames: { icon: 'only-icon' } } });
    expect(appClasses(root())).toEqual(['ads-checkbox']);
    expect(root().className).not.toContain('only-icon');
    expect(appClasses(labelPart())).toEqual(['ads-checkbox-label']);
  });

  it('class: is appended together with classNames.root', () => {
    render(Checkbox, { props: { ...named, class: 'mine', classNames: { root: 'theirs' } } });
    expect(root()).toHaveClass('ads-checkbox', 'mine', 'theirs');
  });

  it('classNames: a change is applied reactively and removed when cleared', async () => {
    const { rerender } = render(Checkbox, { props: { ...named, classNames: { root: 'a' } } });
    expect(root()).toHaveClass('a');
    await rerender({ classNames: { root: 'b' } });
    expect(root()).toHaveClass('b');
    expect(root()).not.toHaveClass('a');
    await rerender({ classNames: undefined });
    expect(root()).not.toHaveClass('b');
  });

  // --- styles / style ---

  it('styles: each part gets its inline style', () => {
    render(Checkbox, {
      props: {
        children: text('Wi-Fi'),
        styles: { root: { 'margin-inline': '4px' }, icon: { 'border-radius': '50%' }, label: { 'font-weight': 600 } }
      }
    });
    expect(styleOf(root()).marginInline).toBe('4px');
    expect(styleOf(icon()).borderRadius).toBe('50%');
    expect(styleOf(labelPart()).fontWeight).toBe('600');
  });

  it('styles: kebab-case names and custom properties are written as given, numbers as-is', () => {
    render(Checkbox, {
      props: { ...named, styles: { root: { '--ads-checkbox-size': '20px', opacity: 0.5, 'z-index': 2 } } }
    });
    expect(styleOf(root()).getPropertyValue('--ads-checkbox-size')).toBe('20px');
    expect(styleOf(root()).opacity).toBe('0.5');
    expect(styleOf(root()).zIndex).toBe('2');
  });

  it('styles: without styles there is no style attribute', () => {
    render(Checkbox, { props: { children: text('Wi-Fi') } });
    expect(root()).not.toHaveAttribute('style');
    expect(icon()).not.toHaveAttribute('style');
    expect(labelPart()).not.toHaveAttribute('style');
  });

  it('styles: update reactively and are removed when cleared', async () => {
    const { rerender } = render(Checkbox, { props: { ...named, styles: { root: { opacity: 1 } } } });
    expect(styleOf(root()).opacity).toBe('1');
    await rerender({ styles: { root: { opacity: 0.5 } } });
    expect(styleOf(root()).opacity).toBe('0.5');
    await rerender({ styles: undefined });
    expect(root()).not.toHaveAttribute('style');
  });

  it('styles: the style attribute and styles.root are merged, styles.root last', () => {
    render(Checkbox, {
      props: { ...named, style: 'margin: 4px; opacity: 1;', styles: { root: { opacity: 0.5 } } }
    });
    expect(styleOf(root()).margin).toBe('4px');
    expect(styleOf(root()).opacity).toBe('0.5');
  });

  it('style: the style attribute alone is applied to the root', () => {
    render(Checkbox, { props: { ...named, style: 'margin: 4px' } });
    expect(root().style.margin).toBe('4px');
  });

  // --- title and native attributes ---

  it('title: is set on the root label, not on the input', () => {
    render(Checkbox, { props: { ...named, title: 'Turn Wi-Fi on' } });
    expect(root()).toHaveAttribute('title', 'Turn Wi-Fi on');
    expect(cb()).not.toHaveAttribute('title');
  });

  it('native attributes: id, data-*, aria-*, tabindex and required are forwarded to the input', () => {
    render(Checkbox, {
      props: {
        id: 'wifi',
        'data-testid': 'wifi-box',
        'aria-describedby': 'hint',
        'aria-label': 'Wi-Fi',
        tabindex: -1,
        required: true
      }
    });
    expect(cb()).toHaveAttribute('id', 'wifi');
    expect(cb()).toHaveAttribute('data-testid', 'wifi-box');
    expect(cb()).toHaveAttribute('aria-describedby', 'hint');
    expect(cb()).toHaveAttribute('tabindex', '-1');
    expect(cb()).toBeRequired();
    expect(screen.getByRole('checkbox', { name: 'Wi-Fi' })).toBe(cb());
    expect(root()).not.toHaveAttribute('id');
  });

  it('native attributes: onfocus, onblur and other handlers are forwarded', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    const onkeydown = vi.fn();
    render(Checkbox, { props: { ...named, onfocus, onblur, onkeydown } });
    await user.tab();
    await user.keyboard('a');
    await user.tab();
    expect(onfocus).toHaveBeenCalledTimes(1);
    expect(onblur).toHaveBeenCalledTimes(1);
    expect(onkeydown.mock.calls.map((call) => call[0].key)).toEqual(['a', 'Tab']);
  });

  it('native attributes: type belongs to the component', () => {
    render(Checkbox, { props: { ...named, type: 'radio' } as never });
    expect(cb()).toHaveAttribute('type', 'checkbox');
  });

  // --- Methods ---

  it('focus() moves focus to the input and blur() removes it', () => {
    const { component } = render(Checkbox, { props: named });
    expect(cb()).not.toHaveFocus();
    component.focus();
    expect(cb()).toHaveFocus();
    component.blur();
    expect(cb()).not.toHaveFocus();
  });

  it('focus() passes its options to the element', () => {
    const { component } = render(Checkbox, { props: named });
    const spy = vi.spyOn(cb(), 'focus');
    component.focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
  });

  // --- Reactivity ---

  it('reactivity: checked, disabled and indeterminate changes update the same element', async () => {
    const { rerender } = render(Checkbox, { props: named });
    const element = cb();
    await rerender({ checked: true, disabled: true });
    expect(cb()).toBe(element);
    expect(element).toBeChecked();
    expect(element).toBeDisabled();
    await rerender({ disabled: false, indeterminate: true });
    expect(element).not.toBeDisabled();
    expect(element.indeterminate).toBe(true);
  });

  // --- Accessibility ---

  it('a11y: is named by its children, by aria-label, by aria-labelledby and by an external label', () => {
    render(Checkbox, { props: { children: text('Wi-Fi') } });
    expect(screen.getByRole('checkbox', { name: 'Wi-Fi' })).toBeInTheDocument();
    document.body.innerHTML = '';

    render(Checkbox, { props: { 'aria-label': 'Airplane mode' } });
    expect(screen.getByRole('checkbox', { name: 'Airplane mode' })).toBeInTheDocument();
    document.body.innerHTML = '';

    const heading = document.createElement('span');
    heading.id = 'heading';
    heading.textContent = 'Notifications';
    document.body.append(heading);
    render(Checkbox, { props: { 'aria-labelledby': 'heading' } });
    expect(screen.getByRole('checkbox', { name: 'Notifications' })).toBeInTheDocument();
    document.body.innerHTML = '';

    const label = document.createElement('label');
    label.htmlFor = 'sound';
    label.textContent = 'Sound';
    document.body.append(label);
    render(Checkbox, { props: { id: 'sound' } });
    expect(screen.getByRole('checkbox', { name: 'Sound' })).toBeInTheDocument();
  });

  it('a11y: clicking an external label toggles the checkbox', async () => {
    const user = userEvent.setup();
    const label = document.createElement('label');
    label.htmlFor = 'sound';
    label.textContent = 'Sound';
    document.body.append(label);
    render(Checkbox, { props: { id: 'sound' } });
    await user.click(label);
    expect(cb()).toBeChecked();
  });

  it('a11y: reports a missing accessible name', async () => {
    const { container } = render(Checkbox);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('label');
  });

  it.each([
    ['unchecked', {}],
    ['checked', { checked: true }],
    ['indeterminate', { indeterminate: true }],
    ['disabled', { disabled: true }],
    ['disabled and checked', { disabled: true, checked: true }]
  ])('a11y: has no axe violations when %s and named by aria-label', async (_name, props) => {
    const { container } = render(Checkbox, { props: { ...named, ...props } });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });

  it('a11y: has no axe violations when named by its children', async () => {
    const { container } = render(Checkbox, { props: { children: text('Wi-Fi'), checked: true } });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
