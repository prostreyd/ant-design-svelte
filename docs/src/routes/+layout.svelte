<script lang="ts">
  import 'svelte-ant-design/tokens.css';
  import '#docs/styles/site.css';

  let { children } = $props();
</script>

{@render children()}
