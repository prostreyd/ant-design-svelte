<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import InputPassword from '$lib/Input/InputPassword.svelte';

  let {
    custom = false,
    ...rest
  }: Omit<ComponentProps<typeof InputPassword>, 'visible' | 'iconRender'> & {
    /** Passes an `iconRender` snippet that prints the visibility it receives. */
    custom?: boolean;
  } = $props();

  let visible = $state(false);
</script>

{#snippet icon(shown: boolean)}<i>{shown ? 'shown' : 'hidden'}</i>{/snippet}

<span data-testid="parent-visible">{visible}</span>
<button type="button" data-testid="parent-show" onclick={() => (visible = true)}>show</button>

<InputPassword bind:visible {...rest} iconRender={custom ? icon : undefined} />
