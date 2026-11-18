<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let free = $state(false);
  let lost = $state(false);
  let primary = $state(false);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">focusable: trap false</span>
    <Button onclick={() => (free = true)}>Tab may leave the dialog</Button>
    <Modal bind:open={free} title="No trap" focusable={{ trap: false }}><p>Tab is left to the browser. The page behind is still out of reach.</p></Modal>
  </div>

  <div class="field">
    <span class="caption">focusable: focusTriggerAfterClose false</span>
    <Button onclick={() => (lost = true)}>Focus does not come back</Button>
    <Modal bind:open={lost} title="No return" focusable={{ focusTriggerAfterClose: false }}><p>After it closes, focus stays where it is.</p></Modal>
  </div>

  <div class="field">
    <span class="caption">focusable: autoFocusButton ok</span>
    <Button onclick={() => (primary = true)}>Focus on OK</Button>
    <Modal bind:open={primary} title="Focus on OK" focusable={{ autoFocusButton: 'ok' }} onok={() => (primary = false)}><p>The OK button has focus when it opens.</p></Modal>
  </div>
</div>

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

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
