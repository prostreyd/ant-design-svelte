<script lang="ts">
  import { Switch } from 'svelte-ant-design';

  let on = $state(false);
  let saving = $state(false);

  function save() {
    saving = true;
    setTimeout(() => (saving = false), 2000);
  }
</script>

<Switch bind:checked={on} loading={saving} onchange={save} aria-label="Auto-save" />
<Switch loading checked aria-label="Loading and on" />
<Switch loading aria-label="Loading and off" />
<Switch loading size="small" checked aria-label="Small, loading and on" />
