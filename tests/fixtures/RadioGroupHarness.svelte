<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import RadioGroup from '$lib/Radio/RadioGroup.svelte';
  import type { RadioValue } from '$lib/Radio/types.js';

  interface Props extends Omit<ComponentProps<typeof RadioGroup>, 'value'> {
    /** Initial value held by the parent. */
    initial?: RadioValue | null;
    /**
     * `bind`: `bind:value`. `plain`: one-way `value={value}`.
     * `confirm`: a function binding whose setter accepts a change only while `allow` is true.
     */
    mode?: 'bind' | 'plain' | 'confirm';
    allow?: boolean;
    /** What the "parent-set" button writes. */
    external?: RadioValue | null;
  }

  let { initial = undefined, mode = 'bind', allow = true, external = 'Pear', ...rest }: Props = $props();

  // svelte-ignore state_referenced_locally
  let value = $state<RadioValue | null | undefined>(initial);
</script>

<!-- A span, not an <output>: a native form reset would put an output back to its initial text. -->
<span data-testid="parent-value">{String(value)}</span>
<button type="button" data-testid="parent-set" onclick={() => (value = external)}>set</button>
<button type="button" data-testid="parent-clear" onclick={() => (value = undefined)}>clear</button>

{#if mode === 'bind'}
  <RadioGroup bind:value {...rest} />
{:else if mode === 'plain'}
  <RadioGroup {value} {...rest} />
{:else}
  <RadioGroup
    bind:value={
      () => value,
      (next) => {
        if (allow) value = next;
      }
    }
    {...rest}
  />
{/if}
