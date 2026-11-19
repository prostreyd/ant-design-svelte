// A layer as a component makes it: the portal and `openOverlay` together, in a Svelte effect (specs/overlay.md, O5).
import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openOverlays } from '../src/lib/internal/overlay/stack';
import OverlayHarness from './fixtures/OverlayHarness.svelte';

const proto = HTMLElement.prototype as unknown as { inert?: boolean };
Object.defineProperty(proto, 'inert', { value: false, configurable: true, writable: true });

afterEach(() => {
  cleanup();
  document.body.removeAttribute('style');
  document.body.innerHTML = '';
});

const get = (id: string) => document.getElementById(id) as HTMLElement;

describe('a layer made of the portal and openOverlay', () => {
  it('the layer is in the body already when openOverlay runs, so the page is what gets hidden', () => {
    const seen = { parent: null as Element | null, inert: false };
    render(OverlayHarness, { seen });
    expect(seen.parent).toBe(document.body);
    // The page is what stands beside the layer in the body: the element that holds the app is inert, and so is the app.
    expect(get('app').closest('[inert]')).not.toBeNull();
    expect(get('wrap').closest('[inert]')).toBeNull();
  });

  it('opens and closes with the flag: focus goes in and comes back, the page comes back, the scroll is let go', async () => {
    const { rerender } = render(OverlayHarness, { open: false });
    get('trigger').focus();
    expect(get('app').closest('[inert]')).toBeNull();
    await rerender({ open: true });
    expect(document.activeElement).toBe(get('box'));
    expect(document.body.style.overflow).toBe('hidden');
    expect(get('app').closest('[inert]')).not.toBeNull();
    await rerender({ open: false });
    expect(get('app').closest('[inert]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(get('trigger'));
    expect(openOverlays()).toHaveLength(0);
  });

  it('Escape asks the component to close', () => {
    const ondismiss = vi.fn();
    render(OverlayHarness, { ondismiss });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(ondismiss).toHaveBeenCalledTimes(1);
  });

  it('destroying the component lets everything go and removes the layer from the body', () => {
    const { unmount } = render(OverlayHarness);
    get('trigger').focus();
    unmount();
    expect(document.getElementById('wrap')).toBeNull();
    expect(openOverlays()).toHaveLength(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('a layer inside a container of the page hides the siblings of the container too', () => {
    document.body.innerHTML = '<section id="host"></section><p id="far"></p>';
    const container = get('host');
    const seen = { parent: null as Element | null, inert: false };
    render(OverlayHarness, { container, seen });
    expect(seen.parent).toBe(container);
    expect(get('far').hasAttribute('inert')).toBe(true);
    expect(get('host').hasAttribute('inert')).toBe(false);
  });
});
