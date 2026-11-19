<script lang="ts">
  import { onMount } from 'svelte';
  import { notification, NotificationHost, type NotificationConfig } from '$lib';

  // The lab of the Notification (specs/notification.md). `window.__notificationLab` gives the tests the `notification` object, a way
  // to mount and unmount a `NotificationHost`, and a few things on the page to click and to measure against.
  let host = $state<NotificationConfig | null>(null);
  let rtl = $state(false);
  let underClicks = $state(0);

  onMount(() => {
    (window as unknown as { __notificationLab: unknown }).__notificationLab = {
      notification,
      /** `containerId`: the id of an element of the page to move the layer to. */
      mountHost(props: NotificationConfig = {}, containerId?: string) {
        host = { ...props, container: containerId ? (document.getElementById(containerId) ?? undefined) : undefined };
      },
      unmountHost() {
        host = null;
      },
      setRtl(value: boolean) {
        rtl = value;
      },
      underClicks: () => underClicks,
      snippets: { body, action, icon }
    };
  });
</script>

{#snippet body()}<b data-testid="note-rich">Rich text</b>{/snippet}
{#snippet action()}<button type="button" data-testid="note-action">Undo</button><a href="#undo" data-testid="note-link">Details</a>{/snippet}
{#snippet icon()}<span data-testid="note-icon">★</span>{/snippet}

<main dir={rtl ? 'rtl' : 'ltr'} style="padding: 120px 40px 40px; min-height: 800px">
  <!-- Under the layer, at the left edge of the top left place: a click next to a box must pass through the (transparent) layer. -->
  <button type="button" data-testid="under" style="position: fixed; left: 8px; top: 8px; z-index: 1" onclick={() => underClicks++}>Under</button>
  <button type="button" data-testid="under-bottom" style="position: fixed; right: 8px; bottom: 8px; z-index: 1">Under bottom</button>
  <button type="button" data-testid="before">Before</button>
  <button type="button" data-testid="after">After</button>
  <section id="container" data-testid="container" style="margin-top: 24px; padding: 8px; border: 1px dashed gray">container</section>
</main>

{#if host}<NotificationHost {...host} />{/if}
