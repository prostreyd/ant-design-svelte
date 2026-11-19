<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

{#snippet star()}<span style="color: gold; font-size: 24px">★</span>{/snippet}

<!-- `icon` replaces the icon of the type: a string (an emoji), a snippet, or `false` for none. -->
<div class="stack">
  <div class="field">
    <span class="caption">icon: a string</span>
    <Button onclick={() => notification.success({ title: 'Launched', description: 'The icon is an emoji.', icon: '🚀' })}>string</Button>
  </div>
  <div class="field">
    <span class="caption">icon: a snippet</span>
    <Button onclick={() => notification.open({ title: 'Starred', description: 'The icon is a snippet.', icon: star })}>snippet</Button>
  </div>
  <div class="field">
    <span class="caption">icon: false</span>
    <Button onclick={() => notification.error({ title: 'Without icon', description: 'The type word is still read by a screen reader.', icon: false })}>false</Button>
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
