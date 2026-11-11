<script lang="ts">
  import { InputSearch } from 'svelte-ant-design';

  let log = $state('nothing searched yet');
  let busy = $state(false);

  function search(value: string, _event: Event, info: { source: 'input' | 'clear' }) {
    log = `onsearch("${value}", source: ${info.source})`;
    busy = true;
    setTimeout(() => (busy = false), 1500);
  }
</script>

{#snippet find()}
  Find
{/snippet}

{#snippet lens()}
  <span aria-hidden="true">?</span>
{/snippet}

<!-- The icon inside the field is a button. A click, Enter and the clear button call onsearch. -->
<InputSearch aria-label="Search" placeholder="Search" allowClear onsearch={search} loading={busy} />
<span role="status">{log}</span>
<!-- enterButton: true is a primary button with the icon; a string or a snippet is its content. -->
<InputSearch aria-label="Search with a button" placeholder="Search" enterButton />
<InputSearch aria-label="Search with text" placeholder="Search" enterButton="Search" size="large" />
<InputSearch aria-label="Search with a snippet" placeholder="Search" enterButton={find} size="small" />
<!-- loading shows a spinner and ignores the search action. -->
<InputSearch aria-label="Loading" value="slow query" enterButton loading />
<InputSearch aria-label="Custom icon" searchIcon={lens} placeholder="Custom icon" />
