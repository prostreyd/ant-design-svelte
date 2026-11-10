<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Switch from '$lib/Switch/Switch.svelte';

  interface Props extends Omit<ComponentProps<typeof Switch>, 'checked'> {
    /** Initial value held by the parent. */
    initial?: boolean;
    /**
     * `bind`: `bind:checked`. `plain`: one-way `checked={value}`.
     * `confirm`: a function binding whose setter accepts a change only while `accept` is true.
     */
    mode?: 'bind' | 'plain' | 'confirm';
    accept?: boolean;
  }

  let { initial = false, mode = 'bind', accept = true, ...rest }: Props = $props();

  // svelte-ignore state_referenced_locally
  let value = $state(initial);
</script>

<output data-testid="parent-value">{value}</output>
<button type="button" data-testid="parent-toggle" onclick={() => (value = !value)}>parent</button>

{#if mode === 'bind'}
  <Switch bind:checked={value} {...rest} />
{:else if mode === 'plain'}
  <Switch checked={value} {...rest} />
{:else}
  <Switch
    bind:checked={
      () => value,
      (next) => {
        if (accept) value = next;
      }
    }
    {...rest}
  />
{/if}
