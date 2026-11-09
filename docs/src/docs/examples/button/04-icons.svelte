<script lang="ts">
  import { Button } from 'svelte-ant-design';
</script>

{#snippet uploadIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 12V2m0 0L4 6m4-4 4 4M2 14h12" />
  </svg>
{/snippet}

<Button type="primary" icon={uploadIcon}>Upload</Button>
<Button icon={uploadIcon} iconPlacement="end">Upload</Button>
<Button shape="circle" icon={uploadIcon} aria-label="Upload" />
