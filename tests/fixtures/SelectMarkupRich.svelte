<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Select from '$lib/Select/Select.svelte';
  import SelectOption from '$lib/Select/SelectOption.svelte';
  import SelectOptGroup from '$lib/Select/SelectOptGroup.svelte';

  let { ...rest }: Omit<ComponentProps<typeof Select>, 'children'> = $props();
</script>

{#snippet bold()}<b>Bold</b>{/snippet}

<Select {...rest}>
  <SelectOption value="rich" label="Plain text" title="A tip" class="mine"><i>Rich</i> content</SelectOption>
  <SelectOption value="titled" title="Zeta">{@render bold()}</SelectOption>
  <SelectOption value="bare" />
  <SelectOption value="num" label={7} />
  <SelectOptGroup label="Group" title="About" class="grp">
    <SelectOption value="in" label="Inside" disabled />
  </SelectOptGroup>
</Select>
