<script lang="ts">
  import { createCopier } from '#docs/copy.svelte';
  import { useT } from '#docs/i18n/use-t';
  import Icon from './Icon.svelte';

  let { text }: { text: string } = $props();
  const t = useT();
  const copier = createCopier();
</script>

<button class="icon-btn" type="button" onclick={() => copier.copy(text)} aria-label={t('demo.copy')} title={t('demo.copy')}>
  <Icon name={copier.copied ? 'check' : 'copy'} />
</button>
<span class="sr-only" role="status">{copier.copied ? t('copy.done') : copier.failed ? t('copy.failed') : ''}</span>
