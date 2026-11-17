<script lang="ts">
  import { Breakpoints, Col, Row } from 'svelte-ant-design';

  // The values are read from the screen when the object is created, so they are right on the first render.
  // On a server, where there is no screen, they follow options.fallback (default 'xs').
  const screens = new Breakpoints();
  const names = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const;
</script>

<div class="stack">
  <div class="field">
    <span class="caption">screens.current</span>
    <output>{screens.current}</output>
  </div>

  <div class="field">
    <span class="caption">screens.xs ... screens.xxxl (xs is true below 576 px, the others from their width up)</span>
    <Row gutter={[8, 8]}>
      {#each names as name (name)}
        <Col xs={12} sm={8} md={6}>
          <div class="box" class:alt={!screens[name]}>{name}: {screens[name]}</div>
        </Col>
      {/each}
    </Row>
  </div>

  <div class="field">
    <span class="caption">{'{#if screens.md}'}: markup that depends on the screen</span>
    {#if screens.md}
      <div class="box">The screen is at least 768 px wide</div>
    {:else}
      <div class="box alt">The screen is narrower than 768 px</div>
    {/if}
  </div>
</div>

<style>
  .stack {
    display: grid;
    gap: 20px;
    width: 100%;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  .box {
    padding: 8px 4px;
    text-align: center;
    font-size: 13px;
    color: var(--ads-color-text);
    background: var(--ads-color-bg-text-hover);
    border: 1px solid var(--ads-color-primary-solid);
    border-radius: 4px;
  }

  .alt {
    background: var(--ads-color-bg-container);
  }
</style>
