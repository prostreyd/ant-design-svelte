// The layer the library makes for a global call when no host is mounted (specs/overlay.md, L1 to L4).
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLayer } from '../src/lib/internal/layer/layer';
import LayerProbe from './fixtures/LayerProbe.svelte';

/** A tiny owner: a flag that says whether a layer is needed, and the listeners to tell when it changes. */
function owner(initial = false) {
  const listeners = new Set<() => void>();
  const state = { wanted: initial };
  const layer = createLayer({
    component: LayerProbe,
    props: { label: 'probe' },
    wanted: () => state.wanted,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
  const change = (wanted: boolean) => {
    state.wanted = wanted;
    for (const listener of [...listeners]) listener();
  };
  return { layer, change, listeners };
}

const probes = () => document.body.querySelectorAll('[data-probe]');

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('making the layer (L1)', () => {
  it('mounts the component on the body, with its props, when a layer is needed', async () => {
    const { layer } = owner(true);
    layer.ensure();
    await tick();
    expect(probes()).toHaveLength(1);
    expect(probes()[0].parentElement).toBe(document.body);
    expect(probes()[0].getAttribute('data-probe')).toBe('probe');
    layer.remove();
  });

  it('mounts nothing while no layer is needed', async () => {
    const { layer } = owner(false);
    layer.ensure();
    await tick();
    expect(probes()).toHaveLength(0);
    layer.remove();
  });

  it('makes one layer however often it is asked', async () => {
    const { layer, listeners } = owner(true);
    layer.ensure();
    layer.ensure();
    layer.ensure();
    await tick();
    expect(probes()).toHaveLength(1);
    expect(listeners.size).toBe(1);
    layer.remove();
  });
});

describe('taking it away (L2)', () => {
  it('removes the layer when it is no longer needed (nothing left, or a host has taken over), and makes it again when it is', async () => {
    const { layer, change } = owner(true);
    layer.ensure();
    await tick();
    expect(probes()).toHaveLength(1);
    change(false);
    await Promise.resolve();
    expect(probes()).toHaveLength(0);
    change(true);
    await Promise.resolve();
    expect(probes()).toHaveLength(1);
    layer.remove();
  });

  it('remove takes the layer away and stops watching: a later change makes nothing', async () => {
    const { layer, change, listeners } = owner(true);
    layer.ensure();
    await tick();
    layer.remove();
    expect(probes()).toHaveLength(0);
    expect(listeners.size).toBe(0);
    change(true);
    await Promise.resolve();
    expect(probes()).toHaveLength(0);
  });

  it('remove with nothing mounted does nothing, and may be repeated', () => {
    const { layer } = owner(false);
    expect(() => {
      layer.remove();
      layer.remove();
    }).not.toThrow();
  });
});

describe('when a change comes (L3)', () => {
  it('a change waits for the next microtask, so that it never mounts in the middle of a teardown', async () => {
    const { layer, change } = owner(true);
    layer.ensure();
    await tick();
    change(false);
    expect(probes()).toHaveLength(1);
    await Promise.resolve();
    expect(probes()).toHaveLength(0);
    layer.remove();
  });

  it('several changes in one go are looked at once, and the last answer wins', async () => {
    const { layer, change } = owner(true);
    layer.ensure();
    await tick();
    change(false);
    change(true);
    change(false);
    await Promise.resolve();
    expect(probes()).toHaveLength(0);
    layer.remove();
  });
});

describe('on a server (L4)', () => {
  it('ensure does nothing and starts no watching where there is no document', () => {
    const { layer, listeners } = owner(true);
    vi.stubGlobal('document', undefined);
    expect(() => layer.ensure()).not.toThrow();
    expect(listeners.size).toBe(0);
  });
});
