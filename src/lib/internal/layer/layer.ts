/**
 * The layer the library makes for a global call when no host is mounted (specs/overlay.md, L1 to L4): a component mounted on
 * the body with the first thing to show, and taken away when nothing is left or a host has taken over. `message.success(...)`
 * and `modal.confirm(...)` use it, and so will every component that is opened from code.
 *
 * The part knows nothing about what the layer draws: the component, its props and the question "is a layer needed now" come from
 * the owner, together with the way to hear that the answer may have changed. Nothing happens on a server.
 */
import { mount, unmount, type Component } from 'svelte';

export interface LayerOptions<Props extends Record<string, unknown>> {
  /** The component that is mounted on the body. */
  component: Component<Props>;
  props: Props;
  /** Whether the library's own layer must be on the page now. */
  wanted(): boolean;
  /** Calls the listener after every change of what `wanted` reads. Returns the function that stops it. */
  subscribe(listener: () => void): () => void;
}

export interface Layer {
  /** Called after each thing is opened: starts watching, and makes the layer if one is needed. */
  ensure(): void;
  /** Takes the layer away and stops watching. For tests, and for a component that is torn down. */
  remove(): void;
}

export function createLayer<Props extends Record<string, unknown>>(options: LayerOptions<Props>): Layer {
  let layer: ReturnType<typeof mount> | null = null;
  let stop: (() => void) | null = null;
  let scheduled = false;

  function sync(): void {
    const needed = options.wanted();
    if (needed && layer === null) {
      layer = mount(options.component, { target: document.body, props: options.props });
    } else if (!needed && layer !== null) {
      const done = layer;
      layer = null;
      void unmount(done);
    }
  }

  /**
   * A change that comes while a component is being torn down (a host that unmounts and hands what it showed back) must not
   * mount a component in the middle of that: Svelte forbids creating effects there. It waits for the next microtask.
   */
  function later(): void {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      sync();
    });
  }

  return {
    ensure() {
      if (typeof document === 'undefined') return;
      stop ??= options.subscribe(later);
      sync();
    },
    remove() {
      stop?.();
      stop = null;
      if (layer !== null) {
        void unmount(layer);
        layer = null;
      }
    }
  };
}
