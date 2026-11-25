<script lang="ts">
  import { TypographyTitle } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">level 2 to 5 (level 1 is the default and is the h1 of a page)</span>
    <div class="titles">
      <TypographyTitle level={2}>h2. Ant Design</TypographyTitle>
      <TypographyTitle level={3}>h3. Ant Design</TypographyTitle>
      <TypographyTitle level={4}>h4. Ant Design</TypographyTitle>
      <TypographyTitle level={5}>h5. Ant Design</TypographyTitle>
    </div>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
    --ads-typography-paragraph-margin-bottom: 0;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
    width: 100%;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
