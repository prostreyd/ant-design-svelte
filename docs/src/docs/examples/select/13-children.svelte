<script lang="ts">
  import { Button, Select, SelectOption, SelectOptGroup } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  let value = $state<SelectValue | undefined>('b');
  let extra = $state(false);
  let keys = $state(['b', 'c', 'd']);
  let ignored = $state<SelectValue | undefined>();
</script>

{#snippet bold()}<b>Rich</b> content{/snippet}

<!-- SelectOption and SelectOptGroup written inside Select give the options, in the order of the markup. -->
<Select bind:value aria-label="Options as markup" style="width: 240px">
  <SelectOption value="a" label="Option A" />
  {#if extra}<SelectOption value="m" label="Inserted in the middle" />{/if}
  <SelectOptGroup label="A group" title="About the group" class="markup-group">
    {#each keys as key (key)}
      <SelectOption value={key} label={`Option ${key.toUpperCase()}`} />
    {/each}
  </SelectOptGroup>
  <SelectOption value="rich" label="Rich option" title="Searched by its label" class="markup-option">{@render bold()}</SelectOption>
  <SelectOption value="off" label="Not available" disabled />
</Select>
<span>{JSON.stringify(value)}</span>
<Button onclick={() => (extra = !extra)}>{extra ? 'Remove' : 'Insert'} an option</Button>
<Button onclick={() => (keys = [...keys].reverse())}>Reverse the group</Button>

<!-- A non-empty options prop wins: the children are ignored. -->
<Select bind:value={ignored} aria-label="Options win" options={['from options']} style="width: 240px">
  <SelectOption value="ignored" label="Ignored" />
</Select>

<style>
  :global(.markup-option) {
    font-style: italic;
  }

  :global(.markup-group) {
    border-top: 1px dashed var(--ads-color-border);
  }
</style>
