<script lang="ts">
  import { useT } from '#docs/i18n/use-t';
  import Icon from './Icon.svelte';

  const t = useT();

  function toggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage can be blocked; the choice then lasts until the page is closed */
    }
  }
</script>

<button class="icon-btn" type="button" onclick={toggle} aria-label={t('hdr.theme')} title={t('hdr.theme')}>
  <Icon name="moon" class="i-moon" />
  <Icon name="sun" class="i-sun" />
</button>
