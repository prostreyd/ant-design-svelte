<script lang="ts">
  import { InputTextArea } from 'svelte-ant-design';

  let notes = $state('');
  let log = $state('nothing yet');
  let presses = $state(0);
</script>

<!-- A native textarea with the props of the input: value, allowClear, showCount, maxlength and the callbacks. -->
<InputTextArea
  bind:value={notes}
  rows={3}
  allowClear
  showCount
  maxlength={120}
  aria-label="Notes"
  placeholder="Notes"
  onchange={(value) => (log = `onchange: ${[...value].length} characters`)}
  onpressenter={() => presses++}
  onclear={() => (log = 'onclear')}
/>
<span role="status">{log}; Enter pressed {presses} times</span>
<InputTextArea count={{ max: 20, show: true }} value="a note that is longer than twenty characters" aria-label="Soft limit" />
<InputTextArea status="error" variant="filled" aria-label="Filled error" value="Filled, error" />
<InputTextArea size="small" variant="underlined" aria-label="Small underlined" placeholder="Small, underlined" />
<InputTextArea disabled aria-label="Disabled" value="Disabled" />
<InputTextArea readonly aria-label="Read only" value="Read only" />
