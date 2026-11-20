<script lang="ts">
  import { Icon } from 'svelte-ant-design';
  import PandaSvg from './panda-svg.part.svelte';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">component: a Svelte component that renders an svg (panda-svg.part.svelte, shown below the example)</span>
    <div class="row">
      <Icon component={PandaSvg} label="Panda" />
      <Icon component={PandaSvg} label="Panda, big" style="font-size: 40px" />
      <Icon component={PandaSvg} spin rotate={20} label="Panda, spinning" />
    </div>
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
    font-size: 28px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
