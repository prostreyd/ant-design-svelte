<script lang="ts">
  import { Input } from 'svelte-ant-design';
</script>

{#snippet domain()}
  <strong>.com</strong>
{/snippet}

<!-- addonBefore and addonAfter are cells outside the border; they take plain text or a snippet. -->
<Input addonBefore="https://" aria-label="Site" placeholder="example" />
<Input addonAfter={domain} aria-label="Domain" placeholder="example" />
<Input addonBefore="https://" addonAfter=".org" aria-label="Both" placeholder="example" size="small" />
