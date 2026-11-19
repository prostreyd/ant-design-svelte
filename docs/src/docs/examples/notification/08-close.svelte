<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

{#snippet word()}Close{/snippet}

<!-- The close button is there by default. `closable: false` or `closeIcon: false` removes it; `closeIcon` replaces the cross. -->
<div class="stack">
  <div class="field">
    <span class="caption">closable: false</span>
    <Button onclick={() => notification.info({ title: 'No close button', description: 'It goes by itself.', closable: false })}>closable false</Button>
  </div>
  <div class="field">
    <span class="caption">closeIcon: a string</span>
    <Button onclick={() => notification.info({ title: 'A text button', description: 'The name of the button stays "Close".', closeIcon: '✕', duration: 8 })}>string</Button>
  </div>
  <div class="field">
    <span class="caption">closeIcon: a snippet</span>
    <Button onclick={() => notification.info({ title: 'A snippet button', description: 'Any content is the icon.', closeIcon: word, duration: 8 })}>snippet</Button>
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
