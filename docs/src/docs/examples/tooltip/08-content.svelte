<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

{#snippet rich()}
  <strong>Bold</strong> and <em>italic</em>, a snippet can hold markup (but not links or buttons: use a popover for those).
{/snippet}

<!-- A string is text, never HTML. -->
<Tooltip title="<b>text</b>, not markup">
  <Button>String</Button>
</Tooltip>

<!-- A snippet is the content. -->
<Tooltip title={rich}>
  <Button>Snippet</Button>
</Tooltip>

<!-- A number is shown, and 0 too. -->
<Tooltip title={0}>
  <Button>Number</Button>
</Tooltip>

<!-- The text wraps at 250 px, and a long word breaks. -->
<Tooltip title="A longer text wraps at a maximum width of 250 pixels, and Supercalifragilisticexpialidocious-is-a-word-that-breaks.">
  <Button>Long text</Button>
</Tooltip>
