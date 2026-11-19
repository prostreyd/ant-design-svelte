<script lang="ts">
  import { onMount } from 'svelte';
  import { message, MessageHost, type MessageConfig } from '$lib';

  // The lab of the Message (specs/message.md). `window.__messageLab` gives the tests the `message` object, a way to
  // mount and unmount a `MessageHost`, and a few things on the page to click and to measure against.
  let host = $state<MessageConfig | null>(null);
  let rtl = $state(false);
  let underClicks = $state(0);

  onMount(() => {
    (window as unknown as { __messageLab: unknown }).__messageLab = {
      message,
      /** `containerId`: the id of an element of the page to move the layer to. */
      mountHost(props: MessageConfig = {}, containerId?: string) {
        host = { ...props, container: containerId ? (document.getElementById(containerId) ?? undefined) : undefined };
      },
      unmountHost() {
        host = null;
      },
      setRtl(value: boolean) {
        rtl = value;
      },
      underClicks: () => underClicks,
      snippets: { link, action }
    };
  });
</script>

{#snippet link()}<a href="#undo" data-testid="msg-link">Undo</a>{/snippet}
{#snippet action()}Saved <button type="button" data-testid="msg-action">Undo</button>{/snippet}

<main dir={rtl ? 'rtl' : 'ltr'} style="padding: 120px 40px 40px; min-height: 800px">
  <!-- Under the layer, at its left edge: a click on it must pass through the (transparent) layer. -->
  <button type="button" data-testid="under" style="position: fixed; left: 8px; top: 8px; z-index: 1" onclick={() => underClicks++}>Under</button>
  <button type="button" data-testid="before">Before</button>
  <button type="button" data-testid="after">After</button>
   <section id="container" data-testid="container" style="margin-top: 24px; padding: 8px; border: 1px dashed gray">container</section>
</main>

{#if host}<MessageHost {...host} />{/if}
