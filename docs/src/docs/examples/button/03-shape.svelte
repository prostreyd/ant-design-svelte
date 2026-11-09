<script lang="ts">
  import { Button } from 'svelte-ant-design';
</script>

{#snippet searchIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
{/snippet}

<Button type="primary">Default</Button>
<Button type="primary" shape="round">Round</Button>
<Button type="primary" shape="circle" icon={searchIcon} aria-label="Search" />
