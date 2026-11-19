<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import { timeLeft } from './store.js';

  /**
   * The strip that runs down with the time a notification has left. It draws from the timer of the list (`timeLeft(id)`), the one that
   * closes the notification, so it stands still on every pause (the pointer, the focus, an open pile, a hidden page) and starts again
   * with an update by key. It is decorative: it is not announced, and it is not motion, so reduced motion does not stop it. It is only
   * drawn for a notification that closes by itself (`duration` above 0).
   */
  let { id, duration, class: className, style }: { id: number; duration: number; class?: string; style?: string } = $props();

  // One look at the timer for every frame; the width is written only when it changed.
  const run: Attachment<HTMLElement> = (element) => {
    const total = duration * 1000;
    let shown = -1;
    let frame = 0;
    const draw = () => {
      const fraction = Math.min(1, timeLeft(id) / total);
      if (fraction !== shown) {
        shown = fraction;
        element.style.inlineSize = `${fraction * 100}%`;
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  };
</script>

<div class={className} {style} aria-hidden="true">
  <div class="ads-notification-progress-bar" {@attach run}></div>
</div>

<style>
  .ads-notification-progress-bar {
    block-size: 100%;
    inline-size: 100%;
    border-radius: inherit;
    background: var(--ads-notification-progress-bg);
  }

  @media (forced-colors: active) {
    .ads-notification-progress-bar {
      background: Highlight;
    }
  }
</style>
