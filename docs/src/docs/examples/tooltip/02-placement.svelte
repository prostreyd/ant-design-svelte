<script lang="ts">
  import { Button, Tooltip, type TooltipPlacement } from 'svelte-ant-design';

  // The buttons stand in a ring, and the middle is empty: a tip that points to the left or to the right then has free
  // space beside it instead of covering the next button. The label is short; the tip says the full name.
  const top: Array<[TooltipPlacement, string]> = [['topLeft', 'TL'], ['top', 'Top'], ['topRight', 'TR']];
  const left: Array<[TooltipPlacement, string]> = [['leftTop', 'LT'], ['left', 'Left'], ['leftBottom', 'LB']];
  const right: Array<[TooltipPlacement, string]> = [['rightTop', 'RT'], ['right', 'Right'], ['rightBottom', 'RB']];
  const bottom: Array<[TooltipPlacement, string]> = [['bottomLeft', 'BL'], ['bottom', 'Bottom'], ['bottomRight', 'BR']];
</script>

{#snippet side(items: Array<[TooltipPlacement, string]>)}
  {#each items as [placement, label] (placement)}
    <Tooltip title={placement} {placement}>
      <Button>{label}</Button>
    </Tooltip>
  {/each}
{/snippet}

<div class="ring">
  <div class="top">{@render side(top)}</div>
  <div class="left">{@render side(left)}</div>
  <div class="right">{@render side(right)}</div>
  <div class="bottom">{@render side(bottom)}</div>
</div>

<style>
  /* A ring: a row on top, a column on each side, a row at the bottom. It shrinks with the screen, so the page does not
     scroll sideways on a phone. */
  .ring {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content;
    grid-template-areas:
      '. top .'
      'left . right'
      '. bottom .';
    gap: 12px;
    width: min(100%, 420px);
    margin-inline: auto;
    padding: 40px 0;
  }

  .top,
  .bottom {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .left,
  .right {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .left {
    align-items: flex-start;
  }

  .right {
    align-items: flex-end;
  }

  .top {
    grid-area: top;
  }

  .left {
    grid-area: left;
  }

  .right {
    grid-area: right;
  }

  .bottom {
    grid-area: bottom;
  }
</style>
