<script lang="ts">
  import { Switch, TypographyText } from 'svelte-ant-design';

  let thinking = $state(true);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">shimmer</span>
    <div class="row">
      <Switch bind:checked={thinking} aria-label="Shimmer" />
      <TypographyText shimmer={thinking}>{thinking ? 'Thinking...' : 'Done.'}</TypographyText>
    </div>
  </div>

  <div class="field">
    <span class="caption">duration: 3</span>
    <TypographyText shimmer={{ duration: 3 }}>A slow sweep, then one second of rest</TypographyText>
  </div>

  <div class="field">
    <span class="caption">duration: [1, 0]</span>
    <TypographyText shimmer={{ duration: [1, 0] }}>A sweep without a pause</TypographyText>
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
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
