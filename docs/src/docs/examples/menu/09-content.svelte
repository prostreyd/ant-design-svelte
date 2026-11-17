<script lang="ts">
  import { Menu, type MenuExpandIconInfo, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'home', label: 'Home', icon: house },
    { key: 'users', label: rich, icon: people, children: [{ key: 'u1', label: 'Active' }, { key: 'u2', label: 'Invited' }] },
    { key: 'settings', label: 'Settings', icon: '⚙', children: [{ key: 's1', label: 'Profile' }] }
  ];

  const wide: MenuItems = [
    { key: 'a', label: 'Overview' },
    { key: 'b', label: 'Reports' },
    { key: 'c', label: 'Billing' },
    { key: 'd', label: 'Team' },
    { key: 'e', label: 'Integrations' },
    { key: 'f', label: 'Audit log' }
  ];
</script>

{#snippet house()}
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8l6-5 6 5M4 7v6h8V7" /></svg>
{/snippet}

{#snippet people()}
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="2.5" /><path d="M3 13c0-3 2-4.5 5-4.5s5 1.5 5 4.5" /></svg>
{/snippet}

{#snippet rich()}<strong>Users</strong>{/snippet}

{#snippet plusMinus(info: MenuExpandIconInfo)}
  <span aria-hidden="true">{info.open ? '−' : '+'}</span>
{/snippet}

{#snippet more()}<span>More ▾</span>{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">label and icon as snippets; expandIcon replaces the arrow (it gets open, disabled, key)</span>
    <div class="frame">
      <Menu aria-label="Custom content" mode="inline" {items} expandIcon={plusMinus} openKeys={['users']} />
    </div>
  </div>

  <div class="field">
    <span class="caption">overflowedIndicator replaces the dots of a bar that does not fit; overflowLabel names it</span>
    <div class="narrow">
      <Menu aria-label="Custom indicator" mode="horizontal" items={wide} overflowedIndicator={more} overflowLabel="More sections" />
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

  .narrow {
    width: 320px;
    max-width: 100%;
  }
</style>
