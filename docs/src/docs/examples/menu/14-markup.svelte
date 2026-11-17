<script lang="ts">
  import { Menu, MenuDivider, MenuItem, MenuItemGroup, MenuSubMenu } from 'svelte-ant-design';

  let selectedKeys = $state(['home']);
  let showBeta = $state(true);
  let beta = $state(['beta-1']);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">MenuItem, MenuSubMenu, MenuItemGroup and MenuDivider written as children: the same tree as items</span>
    <div class="frame">
      <Menu aria-label="Markup menu" mode="inline" bind:selectedKeys openKeys={['more']}>
        <MenuItem key="home" icon="⌂">Home</MenuItem>
        <MenuItem key="docs" icon="▤" extra="⌘D">Documents</MenuItem>
        <MenuSubMenu key="more" label="More" icon="⚙">
          <MenuItem key="profile">Profile</MenuItem>
          <MenuItemGroup label="Danger zone">
            <MenuItem key="export">Export</MenuItem>
            <MenuItem key="delete" danger>Delete</MenuItem>
          </MenuItemGroup>
        </MenuSubMenu>
        <MenuDivider dashed />
        <MenuItem key="off" disabled>Disabled</MenuItem>
      </Menu>
    </div>
    <span role="status">selectedKeys: {selectedKeys.join(', ')}</span>
  </div>

  <div class="field">
    <span class="caption">Components appear in the order of the markup, also when &#123;#if&#125; and &#123;#each&#125; add and remove them</span>
    <label class="check"><input type="checkbox" bind:checked={showBeta} /> Show the beta section</label>
    <div class="frame">
      <Menu aria-label="Dynamic markup" mode="inline" bind:selectedKeys={beta}>
        <MenuItem key="stable">Stable</MenuItem>
        {#if showBeta}
          <MenuItemGroup label="Beta">
            {#each ['beta-1', 'beta-2', 'beta-3'] as key (key)}
              <MenuItem {key}>{key}</MenuItem>
            {/each}
          </MenuItemGroup>
        {/if}
        <MenuItem key="last">Last</MenuItem>
      </Menu>
    </div>
  </div>
</div>

<style>
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
    gap: 16px;
    width: 100%;
  }

  .field {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
    gap: 6px;
    width: 100%;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  .frame {
    width: 256px;
    max-width: 100%;
  }

  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
