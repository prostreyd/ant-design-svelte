<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

<!-- The child is one element. Hover it, or press Tab to focus it: both show the tip. -->
<Tooltip title="prompt text">
  <Button>Tooltip will show on hover and on focus</Button>
</Tooltip>

<!-- A plain element can be hovered; give it tabindex="0" so that the keyboard can reach it too. -->
<Tooltip title="prompt text">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span class="plain" tabindex="0">Plain text with tabindex</span>
</Tooltip>

<style>
  .plain {
    margin-inline-start: 16px;
    text-decoration: underline dotted;
    cursor: help;
  }
</style>
