<script lang="ts">
  import type { Key } from '#docs/i18n';
  import { useT } from '#docs/i18n/use-t';
  import Html from './Html.svelte';

  /** Renders the text with the given key in the language of the current page. */
  let { k }: { k: Key } = $props();
  const t = useT();
</script>

<Html html={t(k)} />
