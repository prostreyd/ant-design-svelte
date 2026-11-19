<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormProbe from './FormProbe.svelte';
  import type { FormInstance } from '../../src/lib/Form/types.js';

  let { onprobe, form }: { onprobe: (form: FormInstance) => void; form?: FormInstance } = $props();
</script>

<Form {form}>
  <FormProbe {onprobe} />
</Form>
