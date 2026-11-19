<script lang="ts">
  // A stand-in for the layer component of a message or a dialog: it only says it is on the page.
  let { label }: { label: string } = $props();
</script>

<div data-probe={label}></div>
