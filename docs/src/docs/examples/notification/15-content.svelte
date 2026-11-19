<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

<!-- Title, description and actions are a string, a number or a snippet. A snippet is drawn in the layer, so it sees the context of the
     place where the host is, not of the component that wrote it. -->
{#snippet title()}<strong>Rich</strong> <em>title</em>{/snippet}
{#snippet description()}A link to <a href="#content">the docs</a> and <code>code</code>.{/snippet}

<Button onclick={() => notification.info({ title, description, duration: 10 })}>Snippets</Button>
