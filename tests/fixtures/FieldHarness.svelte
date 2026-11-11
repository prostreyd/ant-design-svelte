<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    /** `Input`, `InputTextArea`, `InputPassword` or `InputSearch`: they share the `value` contract. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: Component<any>;
    /** Initial text held by the parent. */
    initial?: string;
    /**
     * `bind`: `bind:value`. `plain`: one-way `value={text}`.
     * `confirm`: a function binding whose setter accepts a change only while `allow` is true.
     */
    mode?: 'bind' | 'plain' | 'confirm';
    allow?: boolean;
    [key: string]: unknown;
  }

  let { component: Field, initial = '', mode = 'bind', allow = true, ...rest }: Props = $props();

  // svelte-ignore state_referenced_locally
  let value = $state(initial);
</script>

<!-- A span, not an <output>: a native form reset would put an output back to its initial text. -->
<span data-testid="parent-value">{value}</span>
<button type="button" data-testid="parent-set" onclick={() => (value = 'from parent')}>parent</button>
<button type="button" data-testid="parent-reset" onclick={() => (value = initial)}>reset</button>

{#if mode === 'bind'}
  <Field bind:value {...rest} />
{:else if mode === 'plain'}
  <Field {value} {...rest} />
{:else}
  <Field
    bind:value={
      () => value,
      (next: string) => {
        if (allow) value = next;
      }
    }
    {...rest}
  />
{/if}
