<script lang="ts">
  import { tick } from 'svelte';
  import { Button, notification } from 'svelte-ant-design';

  const KEY = 'container-dialog';

  let dialog = $state<HTMLDialogElement | null>(null);
  // Null before the first press; then where the layer was found: in the body or in the dialog.
  let placed = $state<'body' | 'dialog' | null>(null);

  // `container` is a setting of notification.config(): the element that the layer is put in (the body by default). A native modal
  // <dialog> is shown in the top layer of the browser, over everything that is outside of it, and nothing outside it can be reached.
  // So a layer in the body is covered by the dialog, and a layer in the dialog stands above it and can be used. The setting is
  // given back (and the notification closed) when the dialog closes, and when the example is left, so that the page is not touched.

  async function show(inDialog: boolean) {
    if (!dialog) return;
    notification.config({ container: inDialog ? dialog : undefined });
    notification.info({
      key: KEY,
      title: inDialog ? 'In the dialog' : 'In the body',
      description: inDialog ? 'Above the dialog, and it can be closed.' : 'Behind the dialog.',
      duration: 8,
      props: { 'data-demo': 'container' }
    });
    await tick();
    placed = dialog.contains(document.querySelector('[data-demo="container"]')) ? 'dialog' : 'body';
  }

  function release() {
    notification.destroy(KEY);
    notification.config({ container: undefined });
    placed = null;
  }

  $effect(() => {
    return () => notification.config({ container: undefined });
  });
</script>

<div class="stack">
  <div class="field">
    <span class="caption">a modal dialog</span>
    <div class="row">
      <Button onclick={() => dialog?.showModal()}>Open the dialog</Button>
    </div>
  </div>
</div>

<dialog bind:this={dialog} aria-label="The container example" onclose={release}>
  <div class="stack">
    <div class="field">
      <span class="caption">container: not set (the body)</span>
      <Button onclick={() => show(false)}>Show a notification</Button>
      <span class="out" role="status">
        {#if placed === 'body'}
          The layer is in the body. The dialog covers it, and the notification cannot be reached.
        {:else}
          Press to see where the layer goes.
        {/if}
      </span>
    </div>

    <div class="field">
      <span class="caption">container: the dialog</span>
      <Button onclick={() => show(true)}>Show a notification</Button>
      <span class="out" role="status">
        {#if placed === 'dialog'}
          The layer is in the dialog. The notification stands above it and can be closed.
        {:else}
          Press to see where the layer goes.
        {/if}
      </span>
    </div>

    <div class="row">
      <Button onclick={() => dialog?.close()}>Close the dialog</Button>
    </div>
  </div>
</dialog>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  .out {
    min-height: 36px;
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  dialog {
    box-sizing: border-box;
    width: min(420px, calc(100vw - 32px));
    padding: 20px 24px;
    border: 1px solid var(--ads-color-border);
    border-radius: var(--ads-radius-lg);
    background: var(--ads-color-bg-container);
    color: var(--ads-color-text);
  }

  /* Dark enough to show that what stands under it is covered. */
  dialog::backdrop {
    background: rgb(0 0 0 / 55%);
  }
</style>
