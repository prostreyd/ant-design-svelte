<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';

  interface Props extends Omit<ComponentProps<typeof Checkbox>, 'checked' | 'children'> {
    /** Initial value held by the parent. */
    initial?: boolean;
    /**
     * `bind`: `bind:checked`. `plain`: one-way `checked={value}`.
     * `confirm`: a function binding whose setter accepts a change only while `allow` is true.
     */
    mode?: 'bind' | 'plain' | 'confirm';
    allow?: boolean;
  }

  let { initial = false, mode = 'bind', allow = true, ...rest }: Props = $props();

  // svelte-ignore state_referenced_locally
  let value = $state(initial);
</script>

<!-- A span, not an <output>: a native form reset would put an output back to its initial text. -->
<span data-testid="parent-value">{value}</span>
<button type="button" data-testid="parent-toggle" onclick={() => (value = !value)}>parent</button>

{#if mode === 'bind'}
  <Checkbox bind:checked={value} {...rest}>Wi-Fi</Checkbox>
{:else if mode === 'plain'}
  <Checkbox checked={value} {...rest}>Wi-Fi</Checkbox>
{:else}
  <Checkbox
    bind:checked={
      () => value,
      (next) => {
        if (allow) value = next;
      }
    }
    {...rest}>Wi-Fi</Checkbox
  >
{/if}
