<script lang="ts">
  import { InputOTP } from 'svelte-ant-design';
</script>

{#snippet dash(index: number)}
  <span aria-hidden="true">{index === 1 ? '·' : '-'}</span>
{/snippet}

<div class="stack">
  <!-- mask hides the characters (true is a bullet, a string is the character shown); the value is not changed. -->
  <div class="field">
    <span class="caption">mask</span>
    <InputOTP mask aria-label="Masked" length={4} value="1234" />
  </div>
  <div class="field">
    <span class="caption">mask with a string</span>
    <InputOTP mask="*" aria-label="Masked with a star" length={4} value="1234" />
  </div>

  <!-- formatter maps the whole text to the displayed text. -->
  <div class="field">
    <span class="caption">formatter</span>
    <InputOTP formatter={(value) => value.toUpperCase()} aria-label="Uppercase" length={4} value="ab" />
  </div>

  <!-- separator is text, or a snippet that receives the index of the cell before it. -->
  <div class="field">
    <span class="caption">separator as text</span>
    <InputOTP separator="-" aria-label="Separated" length={6} />
  </div>
  <div class="field">
    <span class="caption">separator as a snippet</span>
    <InputOTP separator={dash} aria-label="Separated by a snippet" length={4} />
  </div>

  <!-- size, variant and status apply to every cell; autocomplete helps the browser fill a code. -->
  <div class="field">
    <span class="caption">size, variant, status</span>
    <InputOTP size="large" variant="filled" status="error" autocomplete="one-time-code" aria-label="Large, filled, error" length={4} />
  </div>
  <div class="field">
    <span class="caption">size, variant</span>
    <InputOTP size="small" variant="underlined" aria-label="Small, underlined" length={4} />
  </div>
  <div class="field">
    <span class="caption">disabled</span>
    <InputOTP disabled aria-label="Disabled" length={4} value="12" />
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
