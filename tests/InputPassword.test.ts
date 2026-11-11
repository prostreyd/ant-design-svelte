import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InputPassword from '../src/lib/Input/InputPassword.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';
import PasswordHarness from './fixtures/PasswordHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
});

const named = { 'aria-label': 'Password' };
/** A password input has no role of its own, so it is found by its name. */
const field = () => screen.getByLabelText('Password') as HTMLInputElement;
const root = () => field().closest('.ads-input') as HTMLElement;
const toggle = () => root().querySelector('.ads-input-password-toggle') as HTMLButtonElement | null;
const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('InputPassword', () => {
  it('default: a password input with a named toggle button in the suffix; the text is hidden', () => {
    render(InputPassword, { props: named });
    expect(field()).toHaveAttribute('type', 'password');
    expect(toggle()!.tagName).toBe('BUTTON');
    expect(toggle()).toHaveAttribute('type', 'button');
    expect(toggle()).toHaveAttribute('aria-label', 'Show password');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()!.closest('.ads-input-suffix')).not.toBeNull();
    expect(toggle()!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('visible: a click shows the text, a second click hides it; aria-pressed follows', async () => {
    const user = userEvent.setup();
    render(InputPassword, { props: { ...named, value: 'secret' } });
    await user.click(toggle()!);
    expect(field()).toHaveAttribute('type', 'text');
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(toggle()).toHaveAttribute('aria-label', 'Show password');
    await user.click(toggle()!);
    expect(field()).toHaveAttribute('type', 'password');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('visible: the initial value is respected, and a parent change re-renders', async () => {
    const { rerender } = render(InputPassword, { props: { ...named, visible: true } });
    expect(field()).toHaveAttribute('type', 'text');
    await rerender({ visible: false });
    expect(field()).toHaveAttribute('type', 'password');
  });

  it('visible: bind:visible follows the toggle and a change of the parent', async () => {
    const user = userEvent.setup();
    render(PasswordHarness, { props: named });
    await user.click(toggle()!);
    expect(screen.getByTestId('parent-visible')).toHaveTextContent('true');
    await user.click(toggle()!);
    expect(screen.getByTestId('parent-visible')).toHaveTextContent('false');
    screen.getByTestId('parent-show').click();
    await tick();
    expect(field()).toHaveAttribute('type', 'text');
  });

  it('onvisiblechange: once per user toggle with the new state; not for a change by the parent', async () => {
    const user = userEvent.setup();
    const onvisiblechange = vi.fn();
    const { rerender } = render(InputPassword, { props: { ...named, onvisiblechange } });
    await user.click(toggle()!);
    await user.click(toggle()!);
    expect(onvisiblechange.mock.calls).toEqual([[true], [false]]);
    await rerender({ visible: true });
    expect(onvisiblechange).toHaveBeenCalledTimes(2);
  });

  it('visibilityToggle: false hides the button; visible still controls the text', () => {
    render(InputPassword, { props: { ...named, visibilityToggle: false, visible: true } });
    expect(toggle()).toBeNull();
    expect(root().querySelector('.ads-input-suffix')).toBeNull();
    expect(field()).toHaveAttribute('type', 'text');
  });

  it('visibilityToggle: the object form sets the accessible name and the tab index', () => {
    render(InputPassword, { props: { ...named, visibilityToggle: { label: 'Reveal', tabIndex: -1 } } });
    expect(toggle()).toHaveAttribute('aria-label', 'Reveal');
    expect(toggle()).toHaveAttribute('tabindex', '-1');
  });

  it('visibilityToggle: true is the default and the button is in the Tab order after the field', async () => {
    const user = userEvent.setup();
    render(InputPassword, { props: named });
    expect(toggle()).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(document.activeElement).toBe(field());
    await user.tab();
    expect(document.activeElement).toBe(toggle());
  });

  it('iconRender: replaces the icon and receives the visibility', async () => {
    const user = userEvent.setup();
    render(PasswordHarness, { props: { ...named, custom: true } });
    expect(toggle()!.querySelector('i')).toHaveTextContent('hidden');
    expect(toggle()!.querySelector('svg')).toBeNull();
    await user.click(toggle()!);
    expect(toggle()!.querySelector('i')).toHaveTextContent('shown');
  });

  it('suffix: a consumer suffix (text or a snippet) comes before the toggle', () => {
    const { unmount } = render(InputPassword, { props: { ...named, suffix: 'x' } });
    const suffix = root().querySelector('.ads-input-suffix')!;
    expect(suffix).toHaveTextContent('x');
    expect(suffix.lastElementChild).toBe(toggle());
    unmount();
    render(InputPassword, { props: { ...named, suffix: text('y') } });
    expect(root().querySelector('.ads-input-suffix b')).toHaveTextContent('y');
    expect(toggle()).not.toBeNull();
  });

  it('suffix: a consumer suffix alone stays when the toggle is off', () => {
    render(InputPassword, { props: { ...named, suffix: 'x', visibilityToggle: false } });
    expect(root().querySelector('.ads-input-suffix')).toHaveTextContent('x');
    expect(toggle()).toBeNull();
  });

  it('a press on the toggle does not take focus from the field', async () => {
    const user = userEvent.setup();
    render(InputPassword, { props: named });
    await user.click(field());
    await user.click(toggle()!);
    expect(document.activeElement).toBe(field());
  });

  it('value: bind:value follows typing, as in Input', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputPassword, ...named } });
    await user.type(field(), 'pw1');
    expect(screen.getByTestId('parent-value')).toHaveTextContent('pw1');
  });

  it('value: a function binding that refuses an edit puts the old text back', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputPassword, mode: 'confirm', allow: false, initial: 'ok', ...named } });
    await user.type(field(), 'x');
    expect(field()).toHaveValue('ok');
  });

  it('the props of Input work: allowClear, showCount, status, size, variant, prefix', async () => {
    const user = userEvent.setup();
    render(InputPassword, {
      props: { ...named, allowClear: true, showCount: true, status: 'error', size: 'large', variant: 'filled', prefix: '#', value: 'abc' }
    });
    expect(root()).toHaveClass('ads-input-large', 'ads-input-filled', 'ads-input-status-error');
    expect(root().querySelector('.ads-input-count')).toHaveTextContent('3');
    expect(root().querySelector('.ads-input-prefix')).toHaveTextContent('#');
    await user.click(root().querySelector('.ads-input-clear')!);
    expect(field()).toHaveValue('');
  });

  it('disabled: the field and the toggle are disabled, and the toggle does nothing', async () => {
    const user = userEvent.setup();
    const onvisiblechange = vi.fn();
    render(InputPassword, { props: { ...named, disabled: true, onvisiblechange } });
    expect(field()).toBeDisabled();
    expect(toggle()).toBeDisabled();
    await user.click(toggle()!);
    expect(onvisiblechange).not.toHaveBeenCalled();
    expect(field()).toHaveAttribute('type', 'password');
  });

  it('classNames and styles: the parts of Input reach it (the toggle is in the suffix part)', () => {
    render(InputPassword, { props: { ...named, classNames: { suffix: 'c-suffix', root: 'c-root' }, styles: { suffix: { opacity: 0.5 } } } });
    expect(root()).toHaveClass('c-root');
    expect(root().querySelector('.ads-input-suffix')).toHaveClass('c-suffix');
    expect((root().querySelector('.ads-input-suffix') as HTMLElement).style.opacity).toBe('0.5');
  });

  it('focus() and blur(): move focus to the input and away; focus({ cursor }) places the caret', () => {
    const { component } = render(InputPassword, { props: { ...named, value: 'hello' } });
    const methods = component as unknown as { focus(options?: { cursor?: 'end' }): void; blur(): void };
    methods.focus({ cursor: 'end' });
    expect(document.activeElement).toBe(field());
    expect([field().selectionStart, field().selectionEnd]).toEqual([5, 5]);
    methods.blur();
    expect(document.activeElement).not.toBe(field());
  });

  it('native attributes: autocomplete, name and onfocus reach the input; type is the component\'s own', async () => {
    const onfocus = vi.fn();
    render(InputPassword, { props: { ...named, autocomplete: 'current-password', name: 'pw', onfocus, type: 'text' } as never });
    expect(field()).toHaveAttribute('autocomplete', 'current-password');
    expect(field()).toHaveAttribute('name', 'pw');
    expect(field()).toHaveAttribute('type', 'password');
    field().focus();
    expect(onfocus).toHaveBeenCalledTimes(1);
  });

  it('onchange: once per edit with the new text and the native input event', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn<(value: string, event: Event) => void>();
    render(InputPassword, { props: { ...named, onchange } });
    await user.type(field(), 'ab');
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['a', 'ab']);
    expect(onchange.mock.calls[0][1].type).toBe('input');
  });

  it('onpressenter: called on Enter with the keyboard event, not on other keys', async () => {
    const user = userEvent.setup();
    const onpressenter = vi.fn<(event: KeyboardEvent) => void>();
    render(InputPassword, { props: { ...named, onpressenter } });
    await user.type(field(), 'a');
    expect(onpressenter).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onpressenter).toHaveBeenCalledTimes(1);
    expect(onpressenter.mock.calls[0][0].key).toBe('Enter');
  });

  it('readonly: the text cannot be typed and cannot be cleared; the toggle still shows it', async () => {
    const user = userEvent.setup();
    render(InputPassword, { props: { ...named, readonly: true, value: 'fixed', allowClear: true } });
    expect(field()).toHaveAttribute('readonly');
    await user.type(field(), 'x');
    expect(field()).toHaveValue('fixed');
    expect(root().querySelector('.ads-input-clear')).toHaveClass('ads-input-clear-hidden');
    await user.click(toggle()!);
    expect(field()).toHaveAttribute('type', 'text');
    expect(field()).toHaveValue('fixed');
  });

  it('maxlength: the native limit holds while typing', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(InputPassword, { props: { ...named, maxlength: 3, onchange } });
    await user.type(field(), 'abcdef');
    expect(field()).toHaveValue('abc');
    expect(onchange).toHaveBeenCalledTimes(3);
  });

  it('allowClear: the object form (label, tab index, icon) reaches the clear button', () => {
    render(InputPassword, { props: { ...named, value: 'a', allowClear: { label: 'Erase', tabIndex: -1, clearIcon: 'x' } } });
    const button = root().querySelector('.ads-input-clear') as HTMLButtonElement;
    expect(button).toHaveAttribute('aria-label', 'Erase');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(button).toHaveTextContent('x');
  });

  it('native attributes: placeholder, id, required, aria-describedby and the oninput, onkeydown and onblur handlers reach the input', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    const onkeydown = vi.fn();
    const onblur = vi.fn();
    render(InputPassword, {
      props: { ...named, placeholder: 'Secret', id: 'pw', required: true, 'aria-describedby': 'hint', oninput, onkeydown, onblur }
    });
    expect(field()).toHaveAttribute('placeholder', 'Secret');
    expect(field()).toHaveAttribute('id', 'pw');
    expect(field()).toBeRequired();
    expect(field()).toHaveAttribute('aria-describedby', 'hint');
    await user.type(field(), 'a');
    expect(oninput).toHaveBeenCalledTimes(1);
    expect(onkeydown).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onblur).toHaveBeenCalledTimes(1);
  });

  it('focus({ preventScroll }): is passed to the browser', () => {
    const { component } = render(InputPassword, { props: named });
    const spy = vi.spyOn(field(), 'focus');
    (component as unknown as { focus(options?: { preventScroll?: boolean }): void }).focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('a11y: reports a missing accessible name', async () => {
    const { container } = render(InputPassword);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('label');
  });

  it.each([
    ['hidden', {}],
    ['visible', { visible: true }],
    ['disabled', { disabled: true }],
    ['without the toggle', { visibilityToggle: false }],
    ['with a custom label', { visibilityToggle: { label: 'Reveal' } }]
  ])('a11y: has no axe violations: %s', async (_name, props) => {
    const { container } = render(InputPassword, { props: { ...named, ...props } });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
