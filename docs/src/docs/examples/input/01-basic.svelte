<script lang="ts">
  import { Input } from 'svelte-ant-design';

  let name = $state('');
  let last = $state('no change yet');
</script>

<!-- bind:value keeps a variable in sync with the field; onchange receives the new text and the native input event. -->
<Input
  bind:value={name}
  aria-label="Name"
  placeholder="Your name"
  onchange={(value, event) => (last = `onchange("${value}", ${event.type})`)}
/>
<span>The name is "{name}"</span>
<span role="status">{last}</span>
