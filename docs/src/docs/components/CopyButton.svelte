<script lang="ts">
  import { useT } from '#docs/i18n/use-t';
  import Icon from './Icon.svelte';

  let { text }: { text: string } = $props();
  const t = useT();
  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* the clipboard may be unavailable */
    }
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<button class="icon-btn" type="button" onclick={copy} aria-label={t('demo.copy')} title={t('demo.copy')}>
  <Icon name={copied ? 'check' : 'copy'} />
</button>
<span class="sr-only" role="status">{copied ? t('copy.done') : ''}</span>
