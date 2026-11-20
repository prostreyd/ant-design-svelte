<script lang="ts">
  import { Button, getTwoToneColor, setTwoToneColor } from 'svelte-ant-design';
  import { CheckCircleTwoTone, HeartTwoTone, SmileTwoTone } from 'svelte-ant-design/icons';
  import { onDestroy } from 'svelte';

  // The colors the library starts with: the theme tokens. `setTwoToneColor` with them puts the default back.
  const THEME = ['var(--ads-icon-twotone-primary)', 'var(--ads-icon-twotone-secondary)'] as [string, string];

  // The global color belongs to the whole page; leaving this example puts the default back.
  onDestroy(() => setTwoToneColor(THEME));
</script>

<div class="stack">
  <div class="field">
    <span class="caption">no twoToneColor: the theme colors</span>
    <div class="row">
      <SmileTwoTone />
    </div>
  </div>

  <div class="field">
    <span class="caption">twoToneColor="#eb2f96", twoToneColor="#52c41a": the second color is derived</span>
    <div class="row">
      <HeartTwoTone twoToneColor="#eb2f96" />
      <CheckCircleTwoTone twoToneColor="#52c41a" />
    </div>
  </div>

  <div class="field">
    <span class="caption">twoToneColor as a pair: [primary, secondary]</span>
    <div class="row">
      <SmileTwoTone twoToneColor={['#1677ff', '#ffe58f']} />
      <HeartTwoTone twoToneColor={['#722ed1', '#d3adf7']} />
    </div>
  </div>

  <div class="field">
    <span class="caption">setTwoToneColor: the default of every two-tone icon of the page that has no color of its own</span>
    <div class="row">
      <HeartTwoTone />
      <Button size="small" onclick={() => setTwoToneColor('#fa8c16')}>Orange</Button>
      <Button size="small" onclick={() => setTwoToneColor(THEME)}>Theme</Button>
    </div>
    <span role="status">getTwoToneColor(): {getTwoToneColor().join(' / ')}</span>
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

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    font-size: 24px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
