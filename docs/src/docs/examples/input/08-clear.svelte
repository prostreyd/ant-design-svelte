<script lang="ts">
  import { Input } from 'svelte-ant-design';

  let cleared = $state(0);
</script>

{#snippet bin()}
  <span aria-hidden="true">×</span>
{/snippet}

<!-- The clear button shows while there is text. It does not take focus from the field; focus stays in it. -->
<Input allowClear value="Clear me" aria-label="Clearable" onclear={() => cleared++} />
<!-- The object form names the button, takes it out of the Tab order and replaces the icon (text or a snippet). -->
<Input
  allowClear={{ label: 'Erase the text', tabIndex: -1, clearIcon: bin }}
  value="Custom button"
  aria-label="Custom clear button"
/>
<Input allowClear={{ clearIcon: 'x' }} value="Text icon" aria-label="Text icon" />
<span role="status">onclear called {cleared} times</span>
