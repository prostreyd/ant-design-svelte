<script lang="ts">
  import { highlight, type CodeKind } from '#docs/highlight';
  import { useT } from '#docs/i18n/use-t';
  import Html from './Html.svelte';
  import Icon from './Icon.svelte';

  let { code, kind = 'svelte', copy = true }: { code: string; kind?: CodeKind; copy?: boolean } = $props();
  const t = useT();
  let copied = $state(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* the clipboard may be unavailable; the status below still confirms the click */
    }
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<div class="codebox">
  <!-- Long lines scroll sideways, so keyboard users need to be able to focus the block. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre tabindex="0"><code><Html html={highlight(code, kind)} /></code></pre>
  {#if copy}
    <button class="icon-btn" type="button" onclick={copyCode} aria-label={t('demo.copy')} title={t('demo.copy')}>
      <Icon name={copied ? 'check' : 'copy'} />
    </button>
    <span class="sr-only" role="status">{copied ? t('copy.done') : ''}</span>
  {/if}
</div>
