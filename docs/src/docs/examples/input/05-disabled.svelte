<script lang="ts">
  import { Input } from 'svelte-ant-design';
</script>

<!-- A disabled field is not focusable and is not submitted; a read-only one is focusable and can be copied. -->
<Input disabled aria-label="Disabled" value="Disabled" />
<Input disabled variant="filled" aria-label="Disabled, filled" value="Disabled, filled" />
<Input readonly aria-label="Read only" value="Read only" />
