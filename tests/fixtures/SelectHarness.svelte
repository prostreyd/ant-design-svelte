<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Select from '$lib/Select/Select.svelte';
  import type { SelectValue } from '$lib/Select/types.js';

  interface Props extends Omit<ComponentProps<typeof Select>, 'value' | 'open' | 'searchValue'> {
    /** The value held by the parent at the start. */
    initial?: SelectValue | SelectValue[] | null;
    /**
     * `bind`: `bind:value`. `plain`: one-way `value={...}`.
     * `confirm`: a function binding whose setter accepts a change only while `allow` is true.
     */
    binding?: 'bind' | 'plain' | 'confirm';
    allow?: boolean;
    /** What the button `parent-set` puts in `value`. */
    setTo?: SelectValue | SelectValue[] | undefined;
    /** `veto`: a function binding for `open` that never accepts a change (a fully controlled list). */
    openMode?: 'bind' | 'veto';
    initialOpen?: boolean;
    initialSearch?: string;
  }

  let {
    initial,
    binding = 'bind',
    allow = true,
    setTo = 'b',
    openMode = 'bind',
    initialOpen = false,
    initialSearch = '',
    ...rest
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let value = $state(initial);
  // svelte-ignore state_referenced_locally
  let open = $state(initialOpen);
  // svelte-ignore state_referenced_locally
  let searchValue = $state(initialSearch);
  let renders = $state(0);
</script>

<span data-testid="parent-value">{JSON.stringify(value) ?? 'undefined'}</span>
<span data-testid="parent-open">{String(open)}</span>
<span data-testid="parent-search">{searchValue}</span>
<span data-testid="renders">{renders}</span>
<button type="button" data-testid="parent-set" onclick={() => (value = setTo)}>set</button>
<button type="button" data-testid="parent-clear" onclick={() => (value = undefined)}>clear</button>
<button type="button" data-testid="parent-open-toggle" onclick={() => (open = !open)}>toggle</button>
<button type="button" data-testid="parent-search-set" onclick={() => (searchValue = 'be')}>search</button>
<button type="button" data-testid="outside" onclick={() => renders++}>outside</button>

{#if binding === 'bind'}
  {#if openMode === 'bind'}
    <Select bind:value bind:open bind:searchValue {...rest} />
  {:else}
    <Select bind:value bind:open={() => open, () => {}} bind:searchValue {...rest} />
  {/if}
{:else if binding === 'plain'}
  <Select {value} bind:open bind:searchValue {...rest} />
{:else}
  <Select
    bind:value={
      () => value,
      (next) => {
        if (allow) value = next;
      }
    }
    bind:open
    bind:searchValue
    {...rest}
  />
{/if}
