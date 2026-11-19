<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'a', label: 'Alpha' },
    { key: 'b', label: 'Beta' },
    { key: 'c', label: 'Gamma' }
  ];

  let single = $state(['a']);
  let singleLog = $state('');
  let multi = $state(['a', 'c']);
  let multiLog = $state('');
  let clickLog = $state('');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">Single selection: a click replaces the choice; onselect runs when it changes</span>
    <div class="frame">
      <Menu aria-label="Single selection" {items} bind:selectedKeys={single} onselect={({ key }) => (singleLog = `onselect: ${key}`)} />
    </div>
    <span role="status">selectedKeys: {single.join(', ')}; {singleLog || 'no change yet'}</span>
  </div>

  <div class="field">
    <span class="caption">multiple: a click toggles the item; onselect and ondeselect tell which</span>
    <div class="frame">
      <Menu
        aria-label="Multiple selection"
        {items}
        multiple
        bind:selectedKeys={multi}
        onselect={({ key }) => (multiLog = `onselect: ${key}`)}
        ondeselect={({ key }) => (multiLog = `ondeselect: ${key}`)}
      />
    </div>
    <span role="status">selectedKeys: {multi.join(', ') || '(none)'}; {multiLog || 'no change yet'}</span>
  </div>

  <div class="field">
    <span class="caption">selectable=&#123;false&#125;: nothing is selected, onclick still runs (an action menu)</span>
    <div class="frame">
      <Menu
        aria-label="Actions"
        {items}
        selectable={false}
        onclick={({ key, keyPath }) => (clickLog = `onclick: ${key} (path ${keyPath.join(' > ')})`)}
      />
    </div>
    <span role="status">{clickLog || 'Choose an item'}</span>
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
</style>
