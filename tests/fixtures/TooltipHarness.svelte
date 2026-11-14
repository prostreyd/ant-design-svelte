<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Button from '$lib/Button/Button.svelte';
  import Select from '$lib/Select/Select.svelte';
  import Tooltip from '$lib/Tooltip/Tooltip.svelte';

  interface Props extends Omit<ComponentProps<typeof Tooltip>, 'children' | 'anchor'> {
    /** What is inside the tooltip: one button, a button that swaps for a link, text only, nothing (with `anchor`). */
    mode?: 'button' | 'swap' | 'text' | 'anchor' | 'none' | 'checkbox' | 'veto' | 'snippet' | 'span' | 'loading' | 'select' | 'disabled';
    /** An `aria-describedby` written by the consumer's own markup. */
    describedBy?: string;
  }

  let { open = $bindable(false), mode = 'button', describedBy, title, ...rest }: Props = $props();
  let swapped = $state(false);
  let removed = $state(false);
  let described = $derived(describedBy);
  let anchorElement = $state<HTMLElement | null>(null);
</script>

<button type="button" data-testid="toggle" onclick={() => (open = !open)}>Toggle</button>
<button type="button" data-testid="swap" onclick={() => (swapped = true)}>Swap</button>
<button type="button" data-testid="remove" onclick={() => (removed = true)}>Remove</button>
<button type="button" data-testid="rewrite" onclick={() => (described = 'other')}>Rewrite</button>
<span data-testid="parent-open">{String(open)}</span>
<button type="button" data-testid="outside" bind:this={anchorElement}>Outside</button>

{#snippet rich()}<strong data-testid="rich">Rich</strong> tip{/snippet}

{#if mode === 'veto'}
  <Tooltip bind:open={() => open, () => {}} {title} {...rest}>
    <button type="button" data-testid="trigger">Trigger</button>
  </Tooltip>
{:else if mode === 'anchor'}
  <Tooltip bind:open {title} anchor={anchorElement} {...rest} />
{:else if mode === 'none'}
  <Tooltip bind:open {title} {...rest} />
{:else if mode === 'text'}
  <Tooltip bind:open {title} {...rest}>Just text</Tooltip>
{:else if mode === 'checkbox'}
  <Tooltip bind:open {title} {...rest}>
    <label data-testid="trigger"><input type="checkbox" data-testid="box" /><span data-testid="label-text">Agree</span></label>
  </Tooltip>
{:else if mode === 'span'}
  <Tooltip bind:open {title} {...rest}>
    <span data-testid="trigger">Not focusable</span>
  </Tooltip>
{:else if mode === 'loading'}
  <Tooltip bind:open {title} {...rest}>
    <Button loading data-testid="trigger">Saving</Button>
  </Tooltip>
{:else if mode === 'disabled'}
  <Tooltip bind:open {title} {...rest}>
    <button type="button" disabled data-testid="trigger">Disabled</button>
  </Tooltip>
{:else if mode === 'select'}
  <Tooltip bind:open {title} {...rest}>
    <Select options={['a', 'b']} aria-label="Pick" data-testid="trigger" />
  </Tooltip>
{:else if mode === 'snippet'}
  <Tooltip bind:open title={rich} {...rest}>
    <button type="button" data-testid="trigger">Trigger</button>
  </Tooltip>
{:else}
  <Tooltip bind:open {title} {...rest}>
    {#if removed}
      <!-- nothing -->
    {:else if swapped}
      <a href="/x" data-testid="trigger2">Second</a>
    {:else}
      <button type="button" data-testid="trigger" aria-describedby={described}>Trigger</button>
    {/if}
  </Tooltip>
{/if}
