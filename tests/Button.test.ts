import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ButtonHarness from './fixtures/ButtonHarness.svelte';

describe('Button', () => {
  it('renders children', () => {
    render(ButtonHarness, { label: 'Click me' });
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders the default type by default', () => {
    const { container } = render(ButtonHarness, { label: 'Default' });
    expect(container.querySelector('button')).toHaveClass('ads-btn-default');
  });

  it('applies the primary type class', () => {
    const { container } = render(ButtonHarness, { type: 'primary', label: 'Go' });
    expect(container.querySelector('button')).toHaveClass('ads-btn-primary');
  });

  it('applies size and shape classes', () => {
    const { container } = render(ButtonHarness, {
      size: 'large',
      shape: 'round',
      label: 'Go'
    });
    const button = container.querySelector('button');
    expect(button).toHaveClass('ads-btn-large');
    expect(button).toHaveClass('ads-btn-round');
  });

  it('applies the danger modifier', () => {
    const { container } = render(ButtonHarness, {
      type: 'primary',
      danger: true,
      label: 'Delete'
    });
    expect(container.querySelector('button')).toHaveClass('ads-btn-danger');
  });

  it('renders the htmlType attribute', () => {
    render(ButtonHarness, { htmlType: 'submit', label: 'Submit' });
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
  });

  it('fires onclick when clicked', async () => {
    const handleClick = vi.fn();
    render(ButtonHarness, { label: 'Go', onclick: handleClick });
    await fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onclick when disabled', async () => {
    const handleClick = vi.fn();
    render(ButtonHarness, { disabled: true, label: 'Go', onclick: handleClick });
    await fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled', () => {
    render(ButtonHarness, { disabled: true, label: 'Go' });
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
  });

  it('is disabled and busy when loading', () => {
    render(ButtonHarness, { loading: true, label: 'Loading' });
    const button = screen.getByRole('button', { name: 'Loading' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire onclick when loading', async () => {
    const handleClick = vi.fn();
    render(ButtonHarness, { loading: true, label: 'Loading', onclick: handleClick });
    await fireEvent.click(screen.getByRole('button', { name: 'Loading' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders an anchor when href is provided', () => {
    render(ButtonHarness, { href: 'https://example.com', label: 'Link' });
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('renders a disabled anchor with aria-disabled when disabled and href', () => {
    render(ButtonHarness, {
      href: 'https://example.com',
      disabled: true,
      label: 'Link'
    });
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});
