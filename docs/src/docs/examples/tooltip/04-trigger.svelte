<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

<!-- The default is hover and focus. A single value or an array. -->
<Tooltip title="hover" trigger="hover">
  <Button>hover</Button>
</Tooltip>

<Tooltip title="focus: it opens when the field gets focus" trigger="focus">
  <input class="field" aria-label="Focus to see the tip" placeholder="focus" />
</Tooltip>

<Tooltip title="click: press again, press elsewhere or Escape to close it" trigger="click">
  <Button>click</Button>
</Tooltip>

<Tooltip title="contextMenu: the browser menu is suppressed" trigger="contextMenu">
  <Button>right click</Button>
</Tooltip>

<Tooltip title="hover or click" trigger={['hover', 'click']}>
  <Button>hover or click</Button>
</Tooltip>

<!-- An empty array: no trigger at all, only the open prop opens it (see Control). -->

<style>
  .field {
    height: 32px;
    padding: 0 11px;
    border: 1px solid var(--ads-color-border);
    border-radius: 6px;
    background: var(--ads-color-bg-container);
    color: var(--ads-color-text);
    font: inherit;
  }
</style>
