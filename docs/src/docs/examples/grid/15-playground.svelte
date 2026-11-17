<script lang="ts">
  import { Col, RadioGroup, Row } from 'svelte-ant-design';

  const gutters = [8, 16, 24, 32, 40, 48];
  let horizontal = $state(16);
  let vertical = $state(16);
  let count = $state(4);
  const counts = [2, 3, 4, 6, 8, 12];
</script>

<div class="stack">
  <div class="field">
    <span class="caption">Horizontal gutter (px)</span>
    <RadioGroup bind:value={horizontal} optionType="button" options={gutters} aria-label="Horizontal gutter" />
  </div>

  <div class="field">
    <span class="caption">Vertical gutter (px)</span>
    <RadioGroup bind:value={vertical} optionType="button" options={gutters} aria-label="Vertical gutter" />
  </div>

  <div class="field">
    <span class="caption">Columns in a row</span>
    <RadioGroup bind:value={count} optionType="button" options={counts} aria-label="Columns in a row" />
  </div>

  <div class="field">
    <span class="caption">{`<Row gutter={[${horizontal}, ${vertical}]}> with ${count} columns of span ${24 / count}, twice`}</span>
    <Row gutter={[horizontal, vertical]}>
      {#each Array.from({ length: count * 2 }, (_, index) => index) as index (index)}
        <Col span={24 / count}><div class="box" class:alt={index >= count}>Column</div></Col>
      {/each}
    </Row>
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
