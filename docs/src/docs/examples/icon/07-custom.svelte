<script lang="ts">
  import { Icon, type IconDefinition } from 'svelte-ant-design';

  // A drawing is data: a name, a theme and the nodes of an svg. This is the shape that `@ant-design/icons-svg` uses for its own.
  const flag: IconDefinition = {
    name: 'flag',
    theme: 'filled',
    icon: {
      tag: 'svg',
      attrs: { viewBox: '0 0 24 24', focusable: 'false' },
      children: [{ tag: 'path', attrs: { d: 'M5 2h2v20H5zM8 3h12l-3 5 3 5H8z' } }]
    }
  };
</script>

{#snippet drop()}
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2C8 8 5 11 5 15a7 7 0 0 0 14 0c0-4-3-7-7-13z" /></svg>
{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">icon: a definition, with spin, rotate and label like any other</span>
    <div class="row">
      <Icon icon={flag} />
      <Icon icon={flag} rotate={90} label="Flag, turned" />
    </div>
  </div>

  <div class="field">
    <span class="caption">children: your own svg inside the icon</span>
    <div class="row">
      <Icon label="Drop">
        {@render drop()}
      </Icon>
      <Icon spin label="Drop, spinning">
        {@render drop()}
      </Icon>
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
    color: var(--ads-color-primary);
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
