<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Wide tables scroll sideways on a phone; the wrapper is focusable so the keyboard can scroll it too. */
  let { labelledby, children }: { labelledby: string; children: Snippet } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="tbl-wrap" role="region" aria-labelledby={labelledby} tabindex="0">
  {@render children()}
</div>
