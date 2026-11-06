import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ButtonHarness from './fixtures/ButtonHarness.svelte';

afterEach(() => {
  vi.useRealTimers();
});

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

  it.each(['large', 'medium', 'small'] as const)('size=%s applies the expected size', (size) => {
    render(ButtonHarness, { size, label: size });
    const button = screen.getByRole('button', { name: size });
    expect(button).toHaveClass(size === 'medium' ? 'ads-btn-middle' : `ads-btn-${size}`);
  });

  it.each(['default', 'circle', 'round'] as const)(
    'shape=%s applies the expected class',
    (shape) => {
      render(ButtonHarness, { shape, label: shape });
      const button = screen.getByRole('button', { name: shape });
      if (shape === 'default') {
        expect(button).not.toHaveClass('ads-btn-circle', 'ads-btn-round');
      } else {
        expect(button).toHaveClass(`ads-btn-${shape}`);
      }
    }
  );

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

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
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
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(99);
    expect(button).not.toBeDisabled();

    await vi.advanceTimersByTimeAsync(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);

    rerender({ loading: false, label: 'Delayed', onclick });
    await tick();
    expect(button).not.toBeDisabled();
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
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('shows loading immediately when the configured delay is zero', async () => {
    render(ButtonHarness, { loading: { delay: 0 }, label: 'Immediate' });
    await tick();
    expect(screen.getByRole('button', { name: 'Immediate' })).toBeDisabled();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid loading delay %s',
    (delay) => {
      expect(() => render(ButtonHarness, { loading: { delay }, label: 'Invalid' })).toThrow(
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
