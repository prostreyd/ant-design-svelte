<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import type { FormInstance } from '../../src/lib/Form/types.js';

  let { onform }: { onform?: (form: FormInstance | undefined) => void } = $props();
  let form = $state<FormInstance>();
  $effect(() => {
    onform?.(form);
  });
</script>

<Form bind:form initialValues={{ a: 1 }}>
  <p>inside</p>
</Form>
