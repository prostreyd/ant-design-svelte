<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Select from '$lib/Select/Select.svelte';
  import SelectOption from '$lib/Select/SelectOption.svelte';
  import SelectOptGroup from '$lib/Select/SelectOptGroup.svelte';

  interface Props extends Omit<ComponentProps<typeof Select>, 'children'> {
    /** The keys of the options inside the group, in the order they are written. */
    keys?: string[];
    /** Writes an option between the first option and the group. */
    showMiddle?: boolean;
    /** The label of the option `b`. */
    labelB?: string;
    /** Disables the option `c`. */
    disableC?: boolean;
    /** Writes the group at all. */
    showGroup?: boolean;
  }

  let { keys = ['b', 'c', 'd'], showMiddle = false, labelB = 'Option B', disableC = false, showGroup = true, ...rest }: Props = $props();
</script>

<Select {...rest}>
  <SelectOption value="a" label="Option A" />
  {#if showMiddle}<SelectOption value="m" label="Middle" />{/if}
  {#if showGroup}
    <SelectOptGroup label="Group">
      {#each keys as key (key)}
        <SelectOption value={key} label={key === 'b' ? labelB : `Option ${key.toUpperCase()}`} disabled={key === 'c' && disableC} />
      {/each}
    </SelectOptGroup>
  {/if}
</Select>
