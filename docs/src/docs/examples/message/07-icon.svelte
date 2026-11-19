<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<!-- A string is shown as text (an emoji, for example), a snippet is drawn as it is, false removes the icon. -->
{#snippet star()}
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M8 1l2.1 4.6 5 .5-3.8 3.4 1.1 4.9L8 11.8 3.6 14.4l1.1-4.9L.9 6.1l5-.5z" />
  </svg>
{/snippet}

<div class="row">
  <Button onclick={() => message.info({ content: 'A string icon', icon: '🎉' })}>string</Button>
  <Button onclick={() => message.warning({ content: 'A snippet icon', icon: star })}>snippet</Button>
  <Button onclick={() => message.success({ content: 'No icon', icon: false })}>false</Button>
</div>

<style>
  .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
</style>
