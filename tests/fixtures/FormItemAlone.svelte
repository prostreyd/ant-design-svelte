<script lang="ts">
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import type { FormItemProps } from '../../src/lib/Form/types.js';

  let { itemProps = {} }: { itemProps?: Partial<FormItemProps> } = $props();
</script>

<FormItem label="Alone" {...itemProps}>
  <span data-testid="alone">content</span>
</FormItem>
