<script lang="ts">
  import { InputOTP } from 'svelte-ant-design';

  let code = $state('');
  let done = $state('');
  let last = $state('');
</script>

<!-- Cells take one character each; focus moves on, Backspace goes back, a pasted code is spread over the cells. -->
<InputOTP
  bind:value={code}
  aria-label="Verification code"
  onchange={(value) => (done = value)}
  oninput={(values) => (last = JSON.stringify(values))}
/>
<span>The code is "{code}"</span>
<span role="status">onchange (all filled): "{done}"; oninput: {last}</span>
<InputOTP length={4} aria-label="Four digits" />
