<script lang="ts">
  import { Button, Checkbox } from 'svelte-ant-design';

  let disabled = $state(true);
</script>

<Checkbox {disabled}>Unchecked</Checkbox>
<Checkbox {disabled} checked>Checked</Checkbox>
<Checkbox {disabled} indeterminate>Indeterminate</Checkbox>
<Button onclick={() => (disabled = !disabled)}>Toggle disabled</Button>
