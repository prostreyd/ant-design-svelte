import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Radio from '../src/lib/Radio/Radio.svelte';
import RadioButton from '../src/lib/Radio/RadioButton.svelte';
import RadioHarness from './fixtures/RadioHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('form, label, span').forEach((element) => {
    if (element.parentElement === document.body) element.remove();
  });
});

const named = { 'aria-label': 'Wi-Fi' };
const radio = () => screen.getByRole('radio') as HTMLInputElement;
const root = () => radio().closest('label') as HTMLLabelElement;
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

// Radio and RadioButton share the contract; the suite runs against both. `prefix` is the class prefix.
const KINDS = [
  { name: 'Radio', Component: Radio, button: false, prefix: 'ads-radio' },
  { name: 'RadioButton', Component: RadioButton, button: true, prefix: 'ads-radio-button' }
] as const;

describe.each(KINDS)('$name', ({ Component, button, prefix }) => {
  const labelPart = () => root().querySelector(`.${prefix}-label`) as HTMLElement | null;
  const harness = (props: Record<string, unknown> = {}) =>
    render(RadioHarness, { props: { button, ...props } });

  // --- Rendering and defaults ---

  it('default: a native radio input in a label, unchecked, not disabled', () => {
    render(Component, { props: named });
    expect(radio().tagName).toBe('INPUT');
    expect(radio()).toHaveAttribute('type', 'radio');
    expect(radio()).not.toBeChecked();
    expect(radio()).not.toBeDisabled();
    expect(root().tagName).toBe('LABEL');
    expect(appClasses(root())).toEqual([prefix]);
    expect(radio()).toHaveClass(`${prefix}-input`);
  });

  it('default: there is no label part without children', () => {
    render(Component, { props: named });
    expect(labelPart()).toBeNull();
  });

  // --- checked ---

  it.each([true, false])('checked=%s: the initial state is reflected by the input and the class', (checked) => {
    render(Component, { props: { ...named, checked } });
    expect(radio().checked).toBe(checked);
    expect(root().classList.contains(`${prefix}-checked`)).toBe(checked);
  });

  it('checked: bind:checked updates the parent on a click', async () => {
    const user = userEvent.setup();
    harness();
    await user.click(radio());
    expect(parentValue()).toBe('true');
    expect(radio()).toBeChecked();
  });

  it('checked: a second click on a checked radio keeps it checked and calls nothing', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    harness({ onchange });
    await user.click(radio());
    await user.click(radio());
    expect(parentValue()).toBe('true');
    expect(radio()).toBeChecked();
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  it('checked: bind:checked follows a change made by the parent in both directions', async () => {
    const user = userEvent.setup();
    harness({ initial: true });
    expect(radio()).toBeChecked();
    await user.click(screen.getByTestId('parent-clear'));
    expect(radio()).not.toBeChecked();
    expect(root()).not.toHaveClass(`${prefix}-checked`);
    await user.click(screen.getByTestId('parent-set'));
    expect(radio()).toBeChecked();
    expect(root()).toHaveClass(`${prefix}-checked`);
  });

  it('checked: a one-way checked={value} selects locally without changing the parent', async () => {
    const user = userEvent.setup();
    harness({ mode: 'plain' });
    await user.click(radio());
    expect(radio()).toBeChecked();
    expect(parentValue()).toBe('false');
  });

  it('checked: a one-way checked={value} follows a later change of the parent', async () => {
    const user = userEvent.setup();
    harness({ mode: 'plain' });
    await user.click(screen.getByTestId('parent-set'));
    expect(radio()).toBeChecked();
    expect(root()).toHaveClass(`${prefix}-checked`);
  });

  // --- onchange ---

  it('onchange: called once per selection with true and the native change event', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Component, { props: { ...named, onchange } });
    await user.click(radio());
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0]).toBe(true);
    expect(onchange.mock.calls[0][1]).toBeInstanceOf(Event);
    expect(onchange.mock.calls[0][1].type).toBe('change');
    expect(onchange.mock.calls[0][1].target).toBe(radio());
  });

  it('onchange: the input already has the new state inside the callback', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    render(Component, {
      props: { ...named, onchange: (_checked: boolean, event: Event) => seen.push((event.target as HTMLInputElement).checked) }
    });
    await user.click(radio());
    expect(seen).toEqual([true]);
  });

  it('onchange: is called for a click on the text', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Component, { props: { onchange, children: text('Wi-Fi') } });
    await user.click(screen.getByText('Wi-Fi'));
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(radio()).toBeChecked();
  });

  it('onchange: is called for Space on the focused radio', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Component, { props: { ...named, onchange } });
    radio().focus();
    await user.keyboard(' ');
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(radio()).toBeChecked();
  });

  it('onchange: is not called for a change of the checked prop made by the parent', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    harness({ onchange });
    await user.click(screen.getByTestId('parent-set'));
    expect(radio()).toBeChecked();
    expect(onchange).not.toHaveBeenCalled();
  });

  it('onchange: is not called while disabled, whatever is clicked', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Component, { props: { onchange, disabled: true, children: text('Wi-Fi') } });
    await user.click(radio());
    await user.click(screen.getByText('Wi-Fi'));
    expect(onchange).not.toHaveBeenCalled();
    expect(radio()).not.toBeChecked();
  });

  // --- Function binding and the veto ---

  it('function binding: a parent that refuses a selection keeps the input unchecked', async () => {
    const user = userEvent.setup();
    harness({ mode: 'confirm', allow: false });
    await user.click(radio());
    expect(radio()).not.toBeChecked();
    expect(parentValue()).toBe('false');
    expect(root()).not.toHaveClass(`${prefix}-checked`);
  });

  it('function binding: a parent that accepts a selection checks the input', async () => {
    const user = userEvent.setup();
    harness({ mode: 'confirm', allow: true });
    await user.click(radio());
    expect(radio()).toBeChecked();
    expect(parentValue()).toBe('true');
  });

  it('onclick: preventDefault() in a forwarded onclick cancels the selection and onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Component, {
      props: { ...named, onchange, onclick: (event: MouseEvent) => event.preventDefault() }
    });
    await user.click(radio());
    expect(radio()).not.toBeChecked();
    expect(onchange).not.toHaveBeenCalled();
  });

  it('onclick: a forwarded onclick runs once per click on the input and once per click on the text', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    render(Component, { props: { onclick, children: text('Wi-Fi') } });
    await user.click(radio());
    expect(onclick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText('Wi-Fi'));
    expect(onclick).toHaveBeenCalledTimes(2);
  });

  // --- disabled ---

  it('disabled: the input is natively disabled and the root has the class', () => {
    render(Component, { props: { ...named, disabled: true } });
    expect(radio()).toBeDisabled();
    expect(root()).toHaveClass(`${prefix}-disabled`);
  });

  it('disabled: a disabled radio is not reached with Tab', async () => {
    const user = userEvent.setup();
    render(Component, { props: { ...named, disabled: true } });
    await user.tab();
    expect(radio()).not.toHaveFocus();
  });

  // --- value ---

  it.each([
    ['a string', 'wifi', 'wifi'],
    ['a number', 7, '7'],
    ['zero', 0, '0'],
    ['true', true, 'true'],
    ['false', false, 'false']
  ])('value: %s is written to the input as text', (_label, value, native) => {
    render(Component, { props: { ...named, value } });
    expect(radio().value).toBe(native);
  });

  it('value: without one the input keeps the native default', () => {
    render(Component, { props: named });
    expect(radio().value).toBe('on');
  });

  // --- children ---

  it('children: rendered in the label part and used as the accessible name', () => {
    render(Component, { props: { children: text('Wi-Fi') } });
    expect(labelPart()).not.toBeNull();
    expect(labelPart()).toHaveTextContent('Wi-Fi');
    expect(screen.getByRole('radio', { name: 'Wi-Fi' })).toBe(radio());
  });

  it('children: a change of the children re-renders the label', async () => {
    const { rerender } = render(Component, { props: { children: text('Wi-Fi') } });
    await rerender({ children: text('Ethernet') });
    expect(labelPart()).toHaveTextContent('Ethernet');
  });

  // --- classNames, styles, class, style, title ---

  it('class and style: reach the root; classNames.root and styles.root are applied after them', () => {
    render(Component, {
      props: {
        ...named,
        class: 'mine',
        style: 'margin-top: 4px; color: red',
        classNames: { root: 'from-parts' },
        styles: { root: { color: 'blue' } }
      }
    });
    expect(root()).toHaveClass('mine', 'from-parts');
    expect(styleOf(root()).marginTop).toBe('4px');
    expect(styleOf(root()).color).toBe('blue');
  });

  it('classNames and styles: the label part gets its class and style', () => {
    render(Component, {
      props: {
        children: text('Wi-Fi'),
        classNames: { label: 'lab' },
        styles: { label: { 'flex-grow': 2, '--x': '1px' } }
      }
    });
    expect(labelPart()).toHaveClass('lab');
    expect(styleOf(labelPart()).getPropertyValue('flex-grow')).toBe('2');
    expect(styleOf(labelPart()).getPropertyValue('--x')).toBe('1px');
  });

  it('styles: update reactively and are removed when cleared', async () => {
    const { rerender } = render(Component, { props: { ...named, styles: { root: { color: 'red' } } } });
    expect(styleOf(root()).color).toBe('red');
    await rerender({ styles: { root: { color: 'green' } } });
    expect(styleOf(root()).color).toBe('green');
    await rerender({ styles: undefined });
    expect(root()).not.toHaveAttribute('style');
  });

  it('title: is on the root label, so it covers the mark and the text', () => {
    render(Component, { props: { ...named, title: 'Wireless' } });
    expect(root()).toHaveAttribute('title', 'Wireless');
  });

  // --- native attributes ---

  it('native attributes: id, name, required, aria-*, data-*, tabindex reach the input', () => {
    render(Component, {
      props: {
        id: 'wifi',
        name: 'net',
        required: true,
        'aria-label': 'Wi-Fi',
        'aria-describedby': 'hint',
        'data-qa': 'x',
        tabindex: -1
      } as never
    });
    expect(radio()).toHaveAttribute('id', 'wifi');
    expect(radio()).toHaveAttribute('name', 'net');
    expect(radio()).toBeRequired();
    expect(radio()).toHaveAttribute('aria-describedby', 'hint');
    expect(radio()).toHaveAttribute('data-qa', 'x');
    expect(radio()).toHaveAttribute('tabindex', '-1');
  });

  it('native attributes: onfocus and onblur are forwarded to the input', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Component, { props: { ...named, onfocus, onblur } });
    await user.tab();
    expect(onfocus).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onblur).toHaveBeenCalledTimes(1);
  });

  it('native attributes: the component owns type', () => {
    render(Component, { props: { ...named, type: 'text' } as never });
    expect(radio()).toHaveAttribute('type', 'radio');
  });

  it('an external <label for> names the radio and a click on it selects', async () => {
    const user = userEvent.setup();
    render(Component, { props: { id: 'wifi' } });
    const outside = document.createElement('label');
    outside.htmlFor = 'wifi';
    outside.textContent = 'Wireless';
    document.body.append(outside);
    expect(screen.getByRole('radio', { name: 'Wireless' })).toBe(radio());
    await user.click(outside);
    expect(radio()).toBeChecked();
  });

  // --- forms ---

  it('forms: a named, checked radio is submitted with its value; an unchecked one is not', async () => {
    const user = userEvent.setup();
    const { container } = render(Component, { props: { ...named, name: 'net', value: 'wifi' } });
    const form = document.createElement('form');
    form.append(container.firstElementChild!);
    document.body.append(form);
    expect(new FormData(form).get('net')).toBeNull();
    await user.click(radio());
    expect(new FormData(form).get('net')).toBe('wifi');
  });

  it('form reset: the input is put back to the state, and a parent that resets its state gets a matching radio', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioHarness, { target: form, props: { button, initial: true } });
    form.addEventListener('reset', () => {
      screen.getByTestId('parent-clear').click();
    });
    expect(radio()).toBeChecked();
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await tick();
    expect(parentValue()).toBe('false');
    expect(radio()).not.toBeChecked();
    await user.click(radio());
    expect(radio()).toBeChecked();
  });

  it('form reset: without a parent that resets its state the radio keeps showing the state', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    render(Component, { target: form, props: { ...named, checked: true } });
    expect(radio()).toBeChecked();
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(radio()).toBeChecked();
  });

  it('form reset: a reset after the radio was removed does nothing and does not throw', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const { unmount } = render(Component, { target: form, props: { ...named, checked: true } });
    unmount();
    expect(() => form.reset()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('form reset: a radio removed right after the reset does not throw when the restore runs', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const { unmount } = render(Component, { target: form, props: { ...named, checked: true } });
    form.reset();
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(form.querySelector('input')).toBeNull();
  });

  // --- Methods ---

  it('focus() and blur() move and remove focus', () => {
    const { component } = render(Component, { props: named }) as unknown as {
      component: { focus: (options?: FocusOptions) => void; blur: () => void };
    };
    component.focus();
    expect(radio()).toHaveFocus();
    component.blur();
    expect(radio()).not.toHaveFocus();
  });

  // --- Reactivity ---

  it('reactivity: disabled re-renders the input and the class', async () => {
    const { rerender } = render(Component, { props: named });
    await rerender({ disabled: true });
    expect(radio()).toBeDisabled();
    expect(root()).toHaveClass(`${prefix}-disabled`);
    await rerender({ disabled: false });
    expect(radio()).not.toBeDisabled();
    expect(root()).not.toHaveClass(`${prefix}-disabled`);
  });

  // --- a11y ---

  it.each([
    ['children', { children: text('Wi-Fi') }],
    ['aria-label', { 'aria-label': 'Wi-Fi' }],
    ['aria-labelledby', { 'aria-labelledby': 'name' }]
  ])('axe: a radio named by %s has no violations, checked, unchecked and disabled', async (_label, props) => {
    const holder = document.createElement('span');
    holder.id = 'name';
    holder.textContent = 'Wi-Fi';
    document.body.append(holder);
    for (const extra of [{}, { checked: true }, { disabled: true }]) {
      const { container, unmount } = render(Component, { props: { ...props, ...extra } as never });
      const results = await axe.run(container, AXE_OPTIONS);
      expect(results.violations).toEqual([]);
      unmount();
    }
  });

  it('axe: an unnamed radio is reported', async () => {
    const { container } = render(Component);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.length).toBeGreaterThan(0);
  });
});

describe('Radio parts', () => {
  const icon = () => root().querySelector('.ads-radio-icon') as HTMLElement;

  it('default: the mark is an aria-hidden span next to the input', () => {
    render(Radio, { props: named });
    const control = radio().parentElement as HTMLElement;
    expect(control).toHaveClass('ads-radio-control');
    expect(icon()).toBe(radio().nextElementSibling);
    expect(icon()).toHaveAttribute('aria-hidden', 'true');
    expect(icon().textContent).toBe('');
  });

  it('classNames and styles: the icon part gets its class and style', () => {
    render(Radio, {
      props: { ...named, classNames: { icon: 'mark' }, styles: { icon: { 'border-width': '3px' } } }
    });
    expect(icon()).toHaveClass('mark');
    expect(styleOf(icon()).borderWidth).toBe('3px');
  });
});

describe('RadioButton parts', () => {
  it('default: there is no icon part, the input is a direct child of the root', () => {
    render(RadioButton, { props: { ...named, children: text('Wi-Fi') } });
    expect(root().querySelector('.ads-radio-icon, [aria-hidden="true"]')).toBeNull();
    expect(radio().parentElement).toBe(root());
  });

  it('default: a button outside a group is medium and outline, with no group classes', () => {
    render(RadioButton, { props: named });
    expect(appClasses(root())).toEqual(['ads-radio-button']);
  });
});
