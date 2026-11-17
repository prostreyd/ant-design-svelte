<script lang="ts">
  import { InputOTP } from 'svelte-ant-design';

  let code = $state('');
  let done = $state('');
  let last = $state('');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">Six cells, the default</span>
    <!-- Cells take one character each; focus moves on, Backspace goes back, a pasted code is spread over the cells. -->
    <InputOTP
      bind:value={code}
      aria-label="Verification code"
      onchange={(value) => (done = value)}
      oninput={(values) => (last = JSON.stringify(values))}
    />
    <span>The code is "{code}"</span>
    <span role="status">onchange (all filled): "{done}"; oninput: {last}</span>
  </div>

  <div class="field">
    <span class="caption">Four cells</span>
    <InputOTP length={4} aria-label="Four digits" />
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
