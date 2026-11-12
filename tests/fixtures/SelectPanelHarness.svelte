<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Select from '$lib/Select/Select.svelte';

  interface Props extends Omit<ComponentProps<typeof Select>, 'popupRender'> {
    /** What the panel holds besides the list: an `input`, a `button`, or another `select`. */
    extra?: 'input' | 'button' | 'select' | 'none';
  }

  let { extra = 'input', ...rest }: Props = $props();
  let presses = $state(0);
</script>

<span data-testid="presses">{presses}</span>

{#snippet popupRender(list: import('svelte').Snippet)}
  <div data-testid="panel-extra">
    {@render list()}
    {#if extra === 'input'}
      <input aria-label="In panel" />
    {:else if extra === 'button'}
      <button type="button" data-testid="panel-button" onclick={() => presses++}>Action</button>
    {:else if extra === 'select'}
      <Select aria-label="Inner" options={['x', 'y']} />
    {/if}
  </div>
{/snippet}

<Select {...rest} {popupRender} />
