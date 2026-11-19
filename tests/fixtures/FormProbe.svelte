<script lang="ts">
  import { getFormInstance } from '../../src/lib/Form/context.js';
  import type { FormInstance } from '../../src/lib/Form/types.js';

  let { onprobe }: { onprobe: (form: FormInstance) => void } = $props();
  const instance = getFormInstance();
  $effect.pre(() => onprobe(instance));
</script>

<span>probe</span>
