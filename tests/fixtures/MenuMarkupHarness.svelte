<script lang="ts">
  import { MenuItem, MenuSubMenu, MenuItemGroup, MenuDivider } from '$lib';
  import Menu from '$lib/Menu/Menu.svelte';
  import type { ComponentProps } from 'svelte';

  interface Props extends Omit<ComponentProps<typeof Menu>, 'children'> {
    showMiddle?: boolean;
    order?: string[];
    withSub?: boolean;
    withTail?: boolean;
    subDisabled?: boolean;
    subTheme?: 'light' | 'dark';
  }

  let { selectedKeys = $bindable([]), openKeys = $bindable([]), showMiddle = false, order = ['a', 'b'], withSub = true, withTail = true, subDisabled = false, subTheme = undefined, ...rest }: Props = $props();
  let ontitle = $state('');
</script>

<Menu aria-label="Markup" bind:selectedKeys bind:openKeys {...rest}>
  <MenuItem key="first" icon="★">First</MenuItem>
  {#if showMiddle}<MenuItem key="middle" label="Middle" />{/if}
  {#each order as name (name)}
    <MenuItem key={name}>Item {name}</MenuItem>
  {/each}
  {#if withSub}
    <MenuSubMenu key="sub" label="Sub" icon="◆" popupClassName="pc" theme={subTheme} disabled={subDisabled} class="sub-class" ontitleclick={(info) => (ontitle = info.key)}>
      <MenuItem key="s1">Sub one</MenuItem>
      <MenuItemGroup label="Group in sub" class="gs">
        <MenuItem key="sg1">SG1</MenuItem>
      </MenuItemGroup>
      <MenuDivider dashed />
      <MenuSubMenu key="deep" label="Deep">
        <MenuItem key="d1">D1</MenuItem>
      </MenuSubMenu>
    </MenuSubMenu>
  {/if}
  {#if withTail}
    <MenuItemGroup label="Group">
      <MenuItem key="g1" danger disabled>G1</MenuItem>
    </MenuItemGroup>
    <MenuDivider />
    <MenuItem key="last" extra="⌘L" title="Tip" class="mine"><b data-testid="rich-label">Last</b></MenuItem>
  {/if}
</Menu>
<span data-testid="selected">{selectedKeys.join(',')}</span>
<span data-testid="open">{openKeys.join('>')}</span>
<span data-testid="ontitle">{ontitle}</span>
