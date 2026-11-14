<script lang="ts">
  import { Button, Tooltip, TOOLTIP_PRESET_COLORS } from 'svelte-ant-design';

  const custom = ['#f50', '#2db7f5', '#87d068', '#108ee9', 'hsl(280 60% 25%)'];
</script>

<!-- A name from the palette is a preset. The text is black or white, whichever contrasts more. -->
{#each TOOLTIP_PRESET_COLORS as color (color)}
  <Tooltip title="{color} tip" {color}>
    <Button>{color}</Button>
  </Tooltip>
{/each}

<span class="break"></span>

<!-- Any other string is a CSS color. The arrow follows it, and so does the text color. -->
{#each custom as color (color)}
  <Tooltip title="{color} tip" {color}>
    <Button>{color}</Button>
  </Tooltip>
{/each}

<style>
  /* The preview is a wrapping row: this empty element is a line break in it. */
  .break {
    flex-basis: 100%;
    height: 0;
  }
</style>
