<script lang="ts">
  import { Button } from 'svelte-ant-design';

  let saving = $state(false);
  function save() {
    saving = true;
    setTimeout(() => (saving = false), 2000);
  }
</script>

<Button type="primary" loading={saving} onclick={save}>Click me</Button>
<Button loading>Loading</Button>
<Button loading={{ delay: 500 }}>Delayed</Button>
