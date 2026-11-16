<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Radio from '$lib/Radio/Radio.svelte';
  import RadioButton from '$lib/Radio/RadioButton.svelte';

  interface Props extends Omit<ComponentProps<typeof Radio>, 'checked' | 'children'> {
    /** Initial value held by the parent. */
    initial?: boolean;
    /**
     * `bind`: `bind:checked`. `plain`: one-way `checked={value}`.
     * `confirm`: a function binding whose setter accepts a change only while `allow` is true.
     */
    mode?: 'bind' | 'plain' | 'confirm';
    allow?: boolean;
    /** Which component to render. */
    button?: boolean;
  }

  let { initial = false, mode = 'bind', allow = true, button = false, ...rest }: Props = $props();

  // svelte-ignore state_referenced_locally
  let value = $state(initial);
</script>

<!-- A span, not an <output>: a native form reset would put an output back to its initial text. -->
<span data-testid="parent-value">{value}</span>
<button type="button" data-testid="parent-set" onclick={() => (value = true)}>set</button>
<button type="button" data-testid="parent-clear" onclick={() => (value = false)}>clear</button>

{#if button}
  {#if mode === 'bind'}
    <RadioButton bind:checked={value} {...rest}>Wi-Fi</RadioButton>
  {:else if mode === 'plain'}
    <RadioButton checked={value} {...rest}>Wi-Fi</RadioButton>
  {:else}
    <RadioButton
      bind:checked={
        () => value,
        (next) => {
          if (allow) value = next;
        }
      }
      {...rest}>Wi-Fi</RadioButton
    >
  {/if}
{:else if mode === 'bind'}
  <Radio bind:checked={value} {...rest}>Wi-Fi</Radio>
{:else if mode === 'plain'}
  <Radio checked={value} {...rest}>Wi-Fi</Radio>
{:else}
  <Radio
    bind:checked={
      () => value,
      (next) => {
        if (allow) value = next;
      }
    }
    {...rest}>Wi-Fi</Radio
  >
{/if}
