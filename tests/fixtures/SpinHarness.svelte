<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Spin from '$lib/Spin/Spin.svelte';

  interface Props extends Omit<ComponentProps<typeof Spin>, 'children'> {
    /** What the Spin covers: nothing (standalone), a paragraph, a button, or another Spin plus a paragraph. */
    content?: 'none' | 'text' | 'button' | 'nested';
    /** The `spinning` of the inner Spin of the `nested` content. */
    innerSpinning?: boolean;
  }

  let { content = 'none', innerSpinning = true, ...rest }: Props = $props();
</script>

{#snippet text()}<p data-testid="content">Table</p>{/snippet}
{#snippet button()}<button type="button">Save</button>{/snippet}
{#snippet nested()}
  <Spin spinning={innerSpinning} description="inner" data-testid="inner" />
  <p data-testid="outer-content">Outer</p>
{/snippet}

<Spin
  {...rest}
  children={content === 'text' ? text : content === 'button' ? button : content === 'nested' ? nested : undefined}
/>
