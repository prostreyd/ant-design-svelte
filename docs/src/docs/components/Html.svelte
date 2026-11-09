<script lang="ts">
  let { html }: { html: string } = $props();
</script>

<!-- The markup comes from the static strings and snippets modules of this repository, never from user input. -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html html}
