<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Menu from '$lib/Menu/Menu.svelte';
  import type { MenuExpandIconInfo, MenuPopupInfo } from '$lib';

  interface Props extends ComponentProps<typeof Menu> {
    /** Which snippet props are given: `expand` (expandIcon), `wrap` (popupRender), `dots` (overflowedIndicator), `rich` (label, icon and extra snippets in the items). */
    variant?: 'plain' | 'expand' | 'wrap' | 'dots';
  }

  let { selectedKeys = $bindable([]), openKeys = $bindable([]), variant = 'plain', ...rest }: Props = $props();
</script>

{#snippet expand(info: MenuExpandIconInfo)}<i data-testid="expand-icon" data-open={String(info.open)} data-disabled={String(info.disabled)} data-key={info.key} data-sub={String(info.isSubMenu)}>v</i>{/snippet}
{#snippet wrap(info: MenuPopupInfo)}<div data-testid="popup-wrap" data-keys={info.keys.join('>')} data-item={info.item?.key ?? 'overflow'}>{@render info.children()}</div>{/snippet}
{#snippet dots()}<b data-testid="dots">more</b>{/snippet}

<button type="button" data-testid="before">before</button>
<Menu
  bind:selectedKeys
  bind:openKeys
  {...rest}
  expandIcon={variant === 'expand' ? expand : rest.expandIcon}
  popupRender={variant === 'wrap' ? wrap : rest.popupRender}
  overflowedIndicator={variant === 'dots' ? dots : rest.overflowedIndicator}
/>
<button type="button" data-testid="after">after</button>
<span data-testid="selected">{selectedKeys.join(',')}</span>
<span data-testid="open">{openKeys.join('>')}</span>
