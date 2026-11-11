<script lang="ts">
  import { InputOTP } from 'svelte-ant-design';
</script>

{#snippet dash(index: number)}
  <span aria-hidden="true">{index === 1 ? '·' : '-'}</span>
{/snippet}

<!-- mask hides the characters (true is a bullet, a string is the character shown); the value is not changed. -->
<InputOTP mask aria-label="Masked" length={4} value="1234" />
<InputOTP mask="*" aria-label="Masked with a star" length={4} value="1234" />
<!-- formatter maps the whole text to the displayed text. -->
<InputOTP formatter={(value) => value.toUpperCase()} aria-label="Uppercase" length={4} value="ab" />
<!-- separator is text, or a snippet that receives the index of the cell before it. -->
<InputOTP separator="-" aria-label="Separated" length={6} />
<InputOTP separator={dash} aria-label="Separated by a snippet" length={4} />
<!-- size, variant and status apply to every cell; autocomplete helps the browser fill a code. -->
<InputOTP size="large" variant="filled" status="error" autocomplete="one-time-code" aria-label="Large, filled, error" length={4} />
<InputOTP size="small" variant="underlined" aria-label="Small, underlined" length={4} />
<InputOTP disabled aria-label="Disabled" length={4} value="12" />
