import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ButtonHarness from './fixtures/ButtonHarness.svelte';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  document.querySelectorAll('form').forEach((form) => form.remove());
});

function createForm(id: string): HTMLFormElement {
  const form = document.createElement('form');
  form.id = id;
  document.body.append(form);
  return form;
}

describe('Button', () => {
  it('renders its label as a button by default', () => {
    render(ButtonHarness, { label: 'Click me' });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('uses the Ant Design React default size and supports the legacy middle alias', () => {
    const { container, rerender } = render(ButtonHarness, { label: 'Default' });
    expect(container.querySelector('button')).toHaveClass('ads-btn-middle');

    rerender({ label: 'Legacy', size: 'middle' });
    expect(screen.getByRole('button', { name: 'Legacy' })).toHaveClass('ads-btn-middle');
  });

  it.each(['primary', 'default', 'dashed', 'text', 'link'] as const)(
    'type=%s applies its visual class',
    (type) => {
      render(ButtonHarness, { type, label: type });
      expect(screen.getByRole('button', { name: type })).toHaveClass(`ads-btn-${type}`);
    }
  );

  it.each([
    ['large', 'ads-btn-large'],
    ['medium', 'ads-btn-middle'],
    ['middle', 'ads-btn-middle'],
    ['small', 'ads-btn-small']
  ] as const)('size=%s applies the class %s', (size, expectedClass) => {
    render(ButtonHarness, { size, label: size });
    expect(screen.getByRole('button', { name: size })).toHaveClass(expectedClass);
  });

  it.each([
    ['default', []],
    ['circle', ['ads-btn-circle']],
    ['round', ['ads-btn-round']]
  ] as const)('shape=%s applies only its own shape class', (shape, expectedClasses) => {
    render(ButtonHarness, { shape, label: shape });
    const shapeClasses = [...screen.getByRole('button', { name: shape }).classList].filter(
      (className) => className === 'ads-btn-circle' || className === 'ads-btn-round'
    );
    expect(shapeClasses).toEqual(expectedClasses);
  });

  it('applies danger, ghost, and block modifiers', () => {
    render(ButtonHarness, {
      type: 'primary',
      danger: true,
      ghost: true,
      block: true,
      label: 'Modifiers'
    });
    const button = screen.getByRole('button', { name: 'Modifiers' });
    expect(button).toHaveClass('ads-btn-danger', 'ads-btn-ghost', 'ads-btn-block');
  });

  it('passes the native htmlType, form, name, and custom class', () => {
    render(ButtonHarness, {
      htmlType: 'submit',
      form: 'profile-form',
      name: 'save',
      class: 'custom-button',
      label: 'Save'
    });
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'profile-form');
    expect(button).toHaveAttribute('name', 'save');
    expect(button).toHaveClass('custom-button');
  });

  it('passes accessible naming attributes to the native element', () => {
    render(ButtonHarness, { icon: true, ariaLabel: 'Close dialog' });
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('renders the icon snippet before the label by default and hides it from assistive technology', () => {
    render(ButtonHarness, { icon: true, label: 'Upload' });
    const button = screen.getByRole('button', { name: 'Upload' });
    const icon = button.querySelector('.ads-btn-icon');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.nextElementSibling).toHaveClass('ads-btn-content');
  });

  it('renders the icon snippet after the label when iconPlacement is end', () => {
    render(ButtonHarness, { icon: true, iconPlacement: 'end', label: 'Upload' });
    const button = screen.getByRole('button', { name: 'Upload' });
    expect(button.querySelector('.ads-btn-content')?.nextElementSibling).toHaveClass(
      'ads-btn-icon'
    );
  });

  it('renders an icon-only anchor with a custom accessible name', () => {
    render(ButtonHarness, {
      props: {
        href: 'https://example.com',
        icon: true,
        showLabel: false,
        ariaLabel: 'Upload file'
      }
    });
    const link = screen.getByRole('link', { name: 'Upload file' });
    expect(link.querySelector('.ads-btn-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('places an anchor icon after its label when iconPlacement is end', () => {
    render(ButtonHarness, {
      props: {
        href: 'https://example.com',
        icon: true,
        iconPlacement: 'end',
        label: 'Upload'
      }
    });
    const link = screen.getByText('Upload').closest('a');
    expect(link?.querySelector('.ads-btn-content')?.nextElementSibling).toHaveClass(
      'ads-btn-icon'
    );
  });

  it('calls onclick once with the click event', async () => {
    const onclick = vi.fn();
    render(ButtonHarness, { label: 'Go', onclick });
    await fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onclick).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('does not call onclick when disabled', async () => {
    const onclick = vi.fn();
    render(ButtonHarness, { disabled: true, label: 'Disabled', onclick });
    await fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    expect(onclick).not.toHaveBeenCalled();
  });

  it('renders a disabled native button', () => {
    render(ButtonHarness, { disabled: true, label: 'Disabled' });
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('blocks Enter and Space activation when disabled', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    render(ButtonHarness, { disabled: true, label: 'Disabled', onclick });
    const button = screen.getByRole('button', { name: 'Disabled' });

    await user.tab();
    expect(button).not.toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onclick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('shows loading immediately, marks the button busy, and blocks clicks', async () => {
    const onclick = vi.fn();
    render(ButtonHarness, { loading: true, label: 'Loading', onclick });
    const button = screen.getByRole('button', { name: 'Loading' });

    // Not natively disabled: a disabled element would drop keyboard focus.
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveClass('ads-btn-loading', 'ads-btn-disabled');
    expect(button.querySelector('.ads-btn-loading-icon')).toHaveAttribute('aria-hidden', 'true');
    await fireEvent.click(button);
    expect(onclick).not.toHaveBeenCalled();
  });

  it('activates loading after the configured delay and clears the timer when loading changes', async () => {
    vi.useFakeTimers();
    const onclick = vi.fn();
    const { rerender } = render(ButtonHarness, {
      loading: { delay: 100 },
      label: 'Delayed',
      onclick
    });
    const button = screen.getByRole('button', { name: 'Delayed' });

    await tick();
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).not.toHaveAttribute('aria-busy');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(99);
    expect(button).not.toHaveAttribute('aria-disabled');

    await vi.advanceTimersByTimeAsync(1);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);

    rerender({ loading: false, label: 'Delayed', onclick });
    await tick();
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('cancels a pending loading delay when loading becomes false', async () => {
    vi.useFakeTimers();
    const { rerender } = render(ButtonHarness, {
      loading: { delay: 100 },
      label: 'Cancelled'
    });
    const button = screen.getByRole('button', { name: 'Cancelled' });

    await tick();
    await rerender({ loading: false, label: 'Cancelled' });
    await vi.advanceTimersByTimeAsync(100);
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('shows loading immediately when the configured delay is zero', async () => {
    render(ButtonHarness, { loading: { delay: 0 }, label: 'Immediate' });
    await tick();
    expect(screen.getByRole('button', { name: 'Immediate' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('calls onclick once per click for rapid repeated clicks', async () => {
    const onclick = vi.fn();
    render(ButtonHarness, { label: 'Rapid', onclick });
    const button = screen.getByRole('button', { name: 'Rapid' });
    for (let i = 0; i < 5; i += 1) {
      await fireEvent.click(button);
    }
    expect(onclick).toHaveBeenCalledTimes(5);
  });

  it('receives keyboard focus when enabled', async () => {
    const user = userEvent.setup();
    render(ButtonHarness, { label: 'Focusable' });
    await user.tab();
    expect(screen.getByRole('button', { name: 'Focusable' })).toHaveFocus();
  });

  it('does not restart the loading delay when unrelated props change', async () => {
    vi.useFakeTimers();
    const { rerender } = render(ButtonHarness, { loading: { delay: 100 }, label: 'Stable' });
    await tick();
    await vi.advanceTimersByTimeAsync(60);
    await rerender({ loading: { delay: 100 }, label: 'Stable updated' });
    await vi.advanceTimersByTimeAsync(40);
    expect(screen.getByRole('button', { name: 'Stable updated' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid loading delay %s',
    (delay) => {
      let caught: unknown;
      try {
        render(ButtonHarness, { loading: { delay }, label: 'Invalid' });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(RangeError);
      // Svelte appends a component-location line to the message, so match the text.
      expect((caught as Error).message).toContain(
        'Button loading.delay must be a non-negative finite number.'
      );
    }
  );

  it('omits the content wrapper when no children snippet is supplied', () => {
    render(ButtonHarness, { showLabel: false, icon: true, ariaLabel: 'Icon button' });
    const button = screen.getByRole('button', { name: 'Icon button' });
    expect(button.querySelector('.ads-btn-content')).not.toBeInTheDocument();
    expect(button.querySelector('.ads-btn-icon')).toBeInTheDocument();
  });

  it('updates its state when public props change', async () => {
    const { rerender } = render(ButtonHarness, {
      size: 'small',
      label: 'Reactive'
    });
    const button = screen.getByRole('button', { name: 'Reactive' });
    expect(button).toHaveClass('ads-btn-small');

    rerender({ size: 'large', disabled: true, label: 'Reactive' });
    await tick();
    expect(button).toHaveClass('ads-btn-large', 'ads-btn-disabled');
    expect(button).toBeDisabled();
  });

  it('renders an anchor when href is provided, including an empty href', () => {
    const { rerender } = render(ButtonHarness, {
      props: {
        href: 'https://example.com',
        target: '_blank',
        rel: 'noreferrer',
        download: 'report.csv',
        label: 'Open'
      }
    });
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('download', 'report.csv');

    rerender({ href: '', label: 'Empty URL' });
    const emptyUrlAnchor = screen.getByText('Empty URL').closest('a');
    expect(emptyUrlAnchor).toBeInTheDocument();
    expect(emptyUrlAnchor).toHaveAttribute('href', '');
  });

  it('passes through disabled and loading accessibility state to anchors', () => {
    const { rerender } = render(ButtonHarness, {
      props: {
        href: 'https://example.com',
        disabled: true,
        label: 'Disabled link'
      }
    });
    const link = screen.getByRole('link', { name: 'Disabled link' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');

    rerender({ href: 'https://example.com', loading: true, label: 'Loading link' });
    const loadingLink = screen.getByRole('link', { name: 'Loading link' });
    expect(loadingLink).toHaveAttribute('aria-busy', 'true');
    expect(loadingLink).toHaveAttribute('aria-disabled', 'true');
    expect(loadingLink).toHaveAttribute('tabindex', '-1');
  });

  it('prevents navigation and suppresses onclick on a disabled anchor', () => {
    const onclick = vi.fn();
    render(ButtonHarness, {
      props: {
        href: 'https://example.com',
        disabled: true,
        label: 'Disabled link',
        onclick
      }
    });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    screen.getByRole('link', { name: 'Disabled link' }).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onclick).not.toHaveBeenCalled();
  });

  it('keeps disabled anchors out of the Tab order', async () => {
    const user = userEvent.setup();
    render(ButtonHarness, {
      props: { href: '#disabled-link', disabled: true, label: 'Disabled link' }
    });
    const link = screen.getByText('Disabled link').closest('a');

    await user.tab();
    expect(link).not.toHaveFocus();
  });

  it('uses native keyboard activation for an enabled button', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    render(ButtonHarness, { label: 'Keyboard', onclick });
    const button = screen.getByRole('button', { name: 'Keyboard' });

    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('uses Space for native keyboard activation', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    render(ButtonHarness, { label: 'Space', onclick });
    const button = screen.getByRole('button', { name: 'Space' });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(' ');
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('uses Enter for native anchor activation', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    render(ButtonHarness, {
      props: { href: '#button-link', label: 'Keyboard link', onclick }
    });
    const link = screen.getByRole('link', { name: 'Keyboard link' });

    link.focus();
    await user.keyboard('{Enter}');
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  // --- Defaults and optional pieces ---

  it('uses the documented defaults when no props are passed', () => {
    render(ButtonHarness, { label: 'Defaults' });
    const button = screen.getByRole('button', { name: 'Defaults' });

    // Exact list: `not.toHaveClass(a, b)` passes when only some of the classes are absent,
    // so an unexpected modifier would go unnoticed.
    // Svelte also adds a scoping class (`svelte-…`); only component classes are compared.
    expect([...button.classList].filter((name) => name.startsWith('ads-'))).toEqual([
      'ads-btn',
      'ads-btn-default',
      'ads-btn-middle'
    ]);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('renders no icon wrapper when no icon snippet is supplied', () => {
    const { unmount } = render(ButtonHarness, { label: 'No icon' });
    expect(screen.getByRole('button', { name: 'No icon' }).querySelector('.ads-btn-icon')).toBeNull();
    unmount();

    const endPlacement = render(ButtonHarness, {
      iconPlacement: 'end',
      label: 'No icon end'
    });
    expect(screen.getByRole('button', { name: 'No icon end' }).querySelector('.ads-btn-icon')).toBeNull();
    endPlacement.unmount();

    const linkWithoutIcon = render(ButtonHarness, {
      props: { href: 'https://example.com', label: 'No icon link' }
    });
    expect(
      screen.getByRole('link', { name: 'No icon link' }).querySelector('.ads-btn-icon')
    ).toBeNull();
    linkWithoutIcon.unmount();

    render(ButtonHarness, {
      props: { href: 'https://example.com', iconPlacement: 'end', label: 'No icon link end' }
    });
    expect(
      screen.getByRole('link', { name: 'No icon link end' }).querySelector('.ads-btn-icon')
    ).toBeNull();
  });

  it('hides an end icon from assistive technology for buttons and anchors', () => {
    const { unmount } = render(ButtonHarness, {
      icon: true,
      iconPlacement: 'end',
      label: 'End button'
    });
    expect(
      screen.getByRole('button', { name: 'End button' }).querySelector('.ads-btn-icon')
    ).toHaveAttribute('aria-hidden', 'true');
    unmount();

    render(ButtonHarness, {
      props: { href: 'https://example.com', icon: true, iconPlacement: 'end', label: 'End link' }
    });
    expect(
      screen.getByRole('link', { name: 'End link' }).querySelector('.ads-btn-icon')
    ).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the spinner on anchors only while loading, and hides it from assistive technology', () => {
    const { unmount } = render(ButtonHarness, {
      props: { href: 'https://example.com', label: 'Idle link' }
    });
    expect(
      screen.getByRole('link', { name: 'Idle link' }).querySelector('.ads-btn-loading-icon')
    ).toBeNull();
    unmount();

    render(ButtonHarness, {
      props: { href: 'https://example.com', loading: true, label: 'Busy link' }
    });
    expect(
      screen.getByRole('link', { name: 'Busy link' }).querySelector('.ads-btn-loading-icon')
    ).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not show loading on the first synchronous render before the delay', () => {
    vi.useFakeTimers();
    render(ButtonHarness, { loading: { delay: 100 }, label: 'First render' });
    expect(screen.getByRole('button', { name: 'First render' })).not.toBeDisabled();
  });

  // --- Native form behavior of htmlType / form / name / value ---

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(ButtonHarness, { label: 'Default type' });
    expect(screen.getByRole('button', { name: 'Default type' })).toHaveAttribute('type', 'button');
  });

  it('htmlType=submit submits its associated form', async () => {
    const user = userEvent.setup();
    const form = createForm('save-form');
    const onsubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', onsubmit);
    render(ButtonHarness, { htmlType: 'submit', form: 'save-form', label: 'Save' });

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onsubmit).toHaveBeenCalledTimes(1);
  });

  it('htmlType=button does not submit its associated form', async () => {
    const user = userEvent.setup();
    const form = createForm('plain-form');
    const onsubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', onsubmit);
    render(ButtonHarness, { htmlType: 'button', form: 'plain-form', label: 'Plain' });

    await user.click(screen.getByRole('button', { name: 'Plain' }));
    expect(onsubmit).not.toHaveBeenCalled();
  });

  it('htmlType=reset restores the default values of its associated form', async () => {
    const user = userEvent.setup();
    const form = createForm('edit-form');
    const input = document.createElement('input');
    input.defaultValue = 'initial';
    input.value = 'changed';
    form.append(input);
    render(ButtonHarness, { htmlType: 'reset', form: 'edit-form', label: 'Reset' });

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input.value).toBe('initial');
  });

  it('a disabled submit button does not submit its associated form', async () => {
    const user = userEvent.setup();
    const form = createForm('blocked-form');
    const onsubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', onsubmit);
    render(ButtonHarness, {
      htmlType: 'submit',
      form: 'blocked-form',
      disabled: true,
      label: 'Blocked'
    });

    await user.click(screen.getByRole('button', { name: 'Blocked' }));
    expect(onsubmit).not.toHaveBeenCalled();
  });

  it('forwards the native value attribute', () => {
    render(ButtonHarness, { value: 'draft', label: 'Draft' });
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveAttribute('value', 'draft');
  });

  it('ignores htmlType when rendering an anchor', () => {
    render(ButtonHarness, {
      props: { href: 'https://example.com', htmlType: 'submit', label: 'Link' }
    });
    expect(screen.getByRole('link', { name: 'Link' })).not.toHaveAttribute('type');
  });

  it('forwards unknown attributes to the native element', () => {
    render(ButtonHarness, { dataTestid: 'save-button', label: 'Save' });
    expect(screen.getByTestId('save-button')).toBe(screen.getByRole('button', { name: 'Save' }));
  });

  // --- Icon placement ---

  it('places an anchor icon before its label by default', () => {
    render(ButtonHarness, {
      props: { href: 'https://example.com', icon: true, label: 'Start link' }
    });
    const link = screen.getByRole('link', { name: 'Start link' });
    expect(link.querySelector('.ads-btn-icon')?.nextElementSibling).toHaveClass(
      'ads-btn-content'
    );
  });

  // --- Anchor attributes ---

  it('omits anchor attributes that were not provided', () => {
    render(ButtonHarness, { props: { href: 'https://example.com', label: 'Plain link' } });
    const link = screen.getByRole('link', { name: 'Plain link' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
    expect(link).not.toHaveAttribute('download');
  });

  it('renders a bare download attribute for download=true', () => {
    render(ButtonHarness, {
      props: { href: 'https://example.com', download: true, label: 'Download' }
    });
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('download', '');
  });

  it('omits the download attribute for download=false', () => {
    render(ButtonHarness, {
      props: { href: 'https://example.com', download: false, label: 'No download' }
    });
    expect(screen.getByRole('link', { name: 'No download' })).not.toHaveAttribute('download');
  });

  it('enabled anchors expose no disabled, busy, or tabindex state', () => {
    render(ButtonHarness, { props: { href: 'https://example.com', label: 'Enabled link' } });
    const link = screen.getByRole('link', { name: 'Enabled link' });
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('aria-busy');
    expect(link).not.toHaveAttribute('tabindex');
  });

  it('does not activate a link with Space', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    render(ButtonHarness, {
      props: { href: '#space-link', label: 'Space link', onclick }
    });
    screen.getByRole('link', { name: 'Space link' }).focus();

    await user.keyboard(' ');
    expect(onclick).not.toHaveBeenCalled();
  });

  // --- Reactivity and handlers ---

  it('calls the latest onclick handler after a rerender', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(ButtonHarness, { label: 'Handler', onclick: first });

    rerender({ label: 'Handler', onclick: second });
    await user.click(screen.getByRole('button', { name: 'Handler' }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not throw when no onclick handler is supplied', () => {
    render(ButtonHarness, { label: 'No handler' });
    const button = screen.getByRole('button', { name: 'No handler' });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('updates a custom class and removes the previous one', async () => {
    const { rerender } = render(ButtonHarness, { class: 'first-class', label: 'Classy' });
    const button = screen.getByRole('button', { name: 'Classy' });
    expect(button).toHaveClass('first-class');

    rerender({ class: 'second-class', label: 'Classy' });
    await tick();
    expect(button).toHaveClass('second-class');
    expect(button).not.toHaveClass('first-class');
  });

  it('switches between button and anchor rendering while keeping onclick working', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(ButtonHarness, { label: 'Switch', onclick });
    expect(screen.getByRole('button', { name: 'Switch' })).toBeInTheDocument();

    rerender({ href: '#switched', label: 'Switch', onclick });
    await user.click(screen.getByRole('link', { name: 'Switch' }));
    expect(onclick).toHaveBeenCalledTimes(1);

    rerender({ href: undefined, label: 'Switch', onclick });
    await user.click(screen.getByRole('button', { name: 'Switch' }));
    expect(onclick).toHaveBeenCalledTimes(2);
  });

  // --- Loading edge cases ---

  it('shows no spinner while a delay is pending', () => {
    vi.useFakeTimers();
    const { container } = render(ButtonHarness, {
      loading: { delay: 100 },
      label: 'Pending'
    });
    expect(container.querySelector('.ads-btn-loading-icon')).toBeNull();
  });

  it('shows loading immediately when a pending delay is replaced by true', async () => {
    vi.useFakeTimers();
    const { rerender } = render(ButtonHarness, { loading: { delay: 100 }, label: 'Promoted' });
    await tick();

    rerender({ loading: true, label: 'Promoted' });
    await tick();
    const button = screen.getByRole('button', { name: 'Promoted' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('restarts a pending delay with the new value when the delay changes', async () => {
    vi.useFakeTimers();
    const { rerender } = render(ButtonHarness, { loading: { delay: 100 }, label: 'Retimed' });
    await tick();
    await vi.advanceTimersByTimeAsync(60);

    // The original 100 ms timer would fire at t=100; the new 200 ms timer fires at t=260.
    rerender({ loading: { delay: 200 }, label: 'Retimed' });
    await tick();
    await vi.advanceTimersByTimeAsync(150);
    expect(screen.getByRole('button', { name: 'Retimed' })).not.toHaveAttribute('aria-disabled');

    await vi.advanceTimersByTimeAsync(50);
    expect(screen.getByRole('button', { name: 'Retimed' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('loading: stays in the Tab order but blocks keyboard activation', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    render(ButtonHarness, { loading: true, label: 'Busy', onclick });
    const button = screen.getByRole('button', { name: 'Busy' });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onclick).not.toHaveBeenCalled();
  });

  it('loading: keeps keyboard focus when loading starts on a focused button', async () => {
    const user = userEvent.setup();
    const { rerender } = render(ButtonHarness, { label: 'Save' });
    const button = screen.getByRole('button', { name: 'Save' });

    await user.tab();
    expect(button).toHaveFocus();
    rerender({ label: 'Save', loading: true });
    await tick();
    expect(button).toHaveFocus();
    expect(button).not.toBeDisabled();
  });

  it('loading: a submit button does not submit its form', async () => {
    const form = createForm('loading-form');
    const onsubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', onsubmit);
    const user = userEvent.setup();
    render(ButtonHarness, { htmlType: 'submit', form: 'loading-form', loading: true, label: 'Send' });

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onsubmit).not.toHaveBeenCalled();
  });

  it('disabled: a button with disabled and loading stays natively disabled', () => {
    render(ButtonHarness, { disabled: true, loading: true, label: 'Both' });
    const button = screen.getByRole('button', { name: 'Both' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  // --- Disabled and loading anchors ---

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }]
  ])('%s anchor has no href, so it cannot be opened in a new tab', (_state, state) => {
    render(ButtonHarness, {
      props: { href: 'https://example.com', label: 'Blocked', ...state }
    });
    const link = screen.getByRole('link', { name: 'Blocked' });

    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('role', 'link');
  });

  it('disabled anchor: restores href and drops the explicit role when re-enabled', async () => {
    const { rerender } = render(ButtonHarness, {
      props: { href: 'https://example.com', disabled: true, label: 'Toggle' }
    });
    const link = screen.getByRole('link', { name: 'Toggle' });
    expect(link).not.toHaveAttribute('href');

    rerender({ href: 'https://example.com', disabled: false, label: 'Toggle' });
    await tick();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).not.toHaveAttribute('role');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('tabindex');
  });

  it('disabled anchor: an empty href is also removed', () => {
    render(ButtonHarness, { props: { href: '', disabled: true, label: 'Empty off' } });
    expect(screen.getByRole('link', { name: 'Empty off' })).not.toHaveAttribute('href');
  });

  // --- Consumer attributes are forwarded, not swallowed ---

  it('forwards a consumer tabindex to an enabled button and an enabled anchor', () => {
    render(ButtonHarness, { label: 'Btn', attrs: { tabindex: 3 } });
    render(ButtonHarness, { href: '#x', label: 'Lnk', attrs: { tabindex: 4 } });

    expect(screen.getByRole('button', { name: 'Btn' })).toHaveAttribute('tabindex', '3');
    expect(screen.getByRole('link', { name: 'Lnk' })).toHaveAttribute('tabindex', '4');
  });

  it('a disabled anchor forces tabindex -1 over a consumer tabindex', () => {
    render(ButtonHarness, {
      href: '#x',
      disabled: true,
      label: 'Off',
      attrs: { tabindex: 4 }
    });
    expect(screen.getByRole('link', { name: 'Off' })).toHaveAttribute('tabindex', '-1');
  });

  it('forwards a consumer aria-busy and aria-disabled when the component is idle', () => {
    render(ButtonHarness, { label: 'Busy btn', attrs: { 'aria-busy': 'true' } });
    render(ButtonHarness, {
      href: '#x',
      label: 'Off link',
      attrs: { 'aria-disabled': 'true' }
    });

    expect(screen.getByRole('button', { name: 'Busy btn' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('link', { name: 'Off link' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('the loading state overrides a consumer aria-busy value', () => {
    render(ButtonHarness, { loading: true, label: 'Own', attrs: { 'aria-busy': 'false' } });
    expect(screen.getByRole('button', { name: 'Own' })).toHaveAttribute('aria-busy', 'true');
  });

  it('loading anchors do not navigate and do not call onclick', () => {
    const onclick = vi.fn();
    render(ButtonHarness, {
      props: { href: 'https://example.com', loading: true, label: 'Busy link', onclick }
    });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    screen.getByRole('link', { name: 'Busy link' }).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onclick).not.toHaveBeenCalled();
  });

  // --- Invalid input: every enum prop is validated ---

  it.each([
    ['type', { type: 'strong' }],
    ['size', { size: 'xlarge' }],
    ['shape', { shape: 'square' }],
    ['htmlType', { htmlType: 'image' }],
    ['iconPlacement', { iconPlacement: 'top' }]
  ])('rejects an invalid %s value with a RangeError', (name, invalidProps) => {
    let caught: unknown;
    try {
      render(ButtonHarness, { props: { ...invalidProps, label: 'Invalid' } as never });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RangeError);
    expect((caught as Error).message).toContain(`Button ${name} must be one of`);
  });

  // --- Production builds fall back to the documented defaults instead of throwing ---

  const appClasses = (element: Element | null) =>
    [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));

  it.each([
    ['type', { type: 'strong' }],
    ['size', { size: 'xlarge' }],
    ['shape', { shape: 'square' }]
  ])('production: an invalid %s falls back to the default appearance', (_name, invalidProps) => {
    vi.stubEnv('NODE_ENV', 'production');
    const { container } = render(ButtonHarness, {
      props: { ...invalidProps, label: 'Fallback' } as never
    });

    expect(appClasses(container.querySelector('button'))).toEqual([
      'ads-btn',
      'ads-btn-default',
      'ads-btn-middle'
    ]);
  });

  it('production: an invalid htmlType falls back to button', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(ButtonHarness, { props: { htmlType: 'image', label: 'Plain' } as never });
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveAttribute('type', 'button');
  });

  it('production: an invalid iconPlacement falls back to start and keeps the icon', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { container } = render(ButtonHarness, {
      props: { iconPlacement: 'top', icon: true, label: 'Icon' } as never
    });
    const children = [...(container.querySelector('button')?.children ?? [])];

    expect(children.map((child) => child.className.split(' ')[0])).toEqual([
      'ads-btn-icon',
      'ads-btn-content'
    ]);
  });

  it('production: a valid value is still applied', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { container } = render(ButtonHarness, { type: 'primary', size: 'small', label: 'Ok' });
    expect(appClasses(container.querySelector('button'))).toEqual([
      'ads-btn',
      'ads-btn-primary',
      'ads-btn-small'
    ]);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'production: an invalid loading delay %s shows loading immediately',
    async (delay) => {
      vi.stubEnv('NODE_ENV', 'production');
      render(ButtonHarness, { loading: { delay }, label: 'Delay fallback' });
      await tick();

      const button = screen.getByRole('button', { name: 'Delay fallback' });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    }
  );

  it('production: an invalid option on an anchor does not throw either', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(ButtonHarness, {
      props: { href: '#x', htmlType: 'image', label: 'Link fallback' } as never
    });
    expect(screen.getByRole('link', { name: 'Link fallback' })).toBeInTheDocument();
  });

  // --- Accessibility: negative and state checks ---

  it('reports a missing accessible name for an icon-only button', async () => {
    const { container } = render(ButtonHarness, { icon: true, showLabel: false });
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(results.violations.map((violation) => violation.id)).toContain('button-name');
  });

  it('has no axe violations for a loading button and a disabled link', async () => {
    render(ButtonHarness, { loading: true, label: 'Loading', icon: true });
    render(ButtonHarness, { props: { href: 'https://example.com', disabled: true, label: 'Off' } });
    const results = await axe.run(document.body, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations for a named button', async () => {
    const { container } = render(ButtonHarness, { label: 'Accessible', icon: true });
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations for a named anchor', async () => {
    const { container } = render(ButtonHarness, {
      props: { href: 'https://example.com', label: 'Accessible link' }
    });
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(results.violations).toEqual([]);
  });
});
