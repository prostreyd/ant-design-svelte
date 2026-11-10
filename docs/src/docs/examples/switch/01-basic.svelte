<script lang="ts">
  import { Switch } from 'svelte-ant-design';

  let on = $state(true);
  let last = $state('no change yet');
</script>

<Switch
  bind:checked={on}
  aria-label="Notifications"
  onchange={(checked) => (last = `onchange(${checked})`)}
/>
<span>Notifications are {on ? 'on' : 'off'}</span>
<span role="status">{last}</span>
