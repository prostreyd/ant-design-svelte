<script lang="ts">
  import { highlight, type CodeKind } from '#docs/highlight';
  import { createCopier } from '#docs/copy.svelte';
  import { useT } from '#docs/i18n/use-t';
  import Html from './Html.svelte';
  import Icon from './Icon.svelte';

  let { code, kind = 'svelte', copy = true }: { code: string; kind?: CodeKind; copy?: boolean } = $props();
  const t = useT();
  const copier = createCopier();
</script>

<div class="codebox">
  <!-- Long lines scroll sideways, so keyboard users need to be able to focus the block. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre tabindex="0"><code><Html html={highlight(code, kind)} /></code></pre>
  {#if copy}
    <button class="icon-btn" type="button" onclick={() => copier.copy(code)} aria-label={t('demo.copy')} title={t('demo.copy')}>
      <Icon name={copier.copied ? 'check' : 'copy'} />
    </button>
    <span class="sr-only" role="status">{copier.copied ? t('copy.done') : copier.failed ? t('copy.failed') : ''}</span>
  {/if}
</div>
