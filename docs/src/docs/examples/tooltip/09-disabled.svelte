<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';

  let title = $state('A tip');
</script>

<!-- An empty title (undefined, null or '') means no tooltip: it never opens, even with open. -->
<Tooltip {title}>
  <Button>{title ? 'Has a tip' : 'No tip'}</Button>
</Tooltip>
<Button onclick={() => (title = title ? '' : 'A tip')}>Empty the title</Button>

<!-- A disabled button shows its tip (checked in Chromium, Firefox and WebKit, current and at the lowest versions). -->
<Tooltip title="Why it is disabled">
  <Button disabled>Disabled</Button>
</Tooltip>

<!-- For a control that swallows pointer events by itself, a span around it is the safe form. -->
<Tooltip title="Why it is disabled">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span class="wrap" tabindex="0"><Button disabled>Disabled in a span</Button></span>
</Tooltip>

<style>
  .wrap {
    display: inline-block;
  }
</style>
