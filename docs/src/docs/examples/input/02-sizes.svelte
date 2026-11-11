<script lang="ts">
  import { Input } from 'svelte-ant-design';
</script>

<!-- large is 40px high, medium 32px, small 24px. middle and default are aliases of medium. -->
<Input size="large" aria-label="Large" placeholder="large" />
<Input size="medium" aria-label="Medium" placeholder="medium" />
<Input size="small" aria-label="Small" placeholder="small" />
<Input size="middle" aria-label="Middle" placeholder="middle (alias of medium)" />
<Input size="default" aria-label="Default" placeholder="default (alias of medium)" />
