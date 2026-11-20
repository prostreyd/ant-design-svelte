<script lang="ts">
  import { Button } from 'svelte-ant-design';
  import { DeleteOutlined, SearchOutlined, StarOutlined } from 'svelte-ant-design/icons';

  let stars = $state(0);

  // An icon with a click handler is not a button by itself: it gets a role, a place in the tab order and the keys.
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      stars += 1;
    }
  }
</script>

{#snippet search()}
  <SearchOutlined label="" />
{/snippet}
{#snippet remove()}
  <DeleteOutlined label="" />
{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">in a Button with text: the icon is hidden, the text names the button</span>
    <div class="row">
      <Button type="primary" icon={search}>Search</Button>
    </div>
  </div>

  <div class="field">
    <span class="caption">in an icon-only Button: the button is named, the icon is hidden</span>
    <div class="row">
      <Button shape="circle" icon={remove} aria-label="Delete" />
    </div>
  </div>

  <div class="field">
    <span class="caption">an icon with onclick, role="button", tabindex and keys</span>
    <div class="row">
      <StarOutlined label="Add a star" role="button" tabindex={0} onclick={() => (stars += 1)} {onkeydown} style="cursor: pointer; font-size: 24px" />
    </div>
    <span role="status">stars: {stars}</span>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
