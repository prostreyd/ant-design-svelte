<script lang="ts">
  import { Button, Switch } from 'svelte-ant-design';

  let disabled = $state(true);
</script>

<Switch checked {disabled} aria-label="Disabled and on" />
<Switch {disabled} aria-label="Disabled and off" />
<Button onclick={() => (disabled = !disabled)}>Toggle disabled</Button>
