<script lang="ts">
  import { page } from '$app/state';
  import { href } from '#docs/href';
  import { LANG_INFO, LANGS } from '#docs/i18n';
  import { useT } from '#docs/i18n/use-t';
  import { localize, logicalPath } from '#docs/pages';
  import Icon from './Icon.svelte';

  const t = useT();
  let open = $state(false);
  const path = $derived(logicalPath(page.route.id));

  function onWindowClick(event: MouseEvent) {
    if (!(event.target as Element).closest('.langwrap')) open = false;
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={(event) => event.key === 'Escape' && (open = false)} />

<div class="langwrap">
  <button
    class="chip"
    type="button"
    aria-expanded={open}
    aria-controls="lang-menu"
    aria-label="{t('hdr.lang')}: {LANG_INFO[page.data.lang].label}"
    onclick={() => (open = !open)}
  >
    <Icon name="globe" /><span>{LANG_INFO[page.data.lang].label}</span>
  </button>
  <!-- The links stay in the document (hidden) so that every language version can be crawled. -->
  <ul class="menu" id="lang-menu" hidden={!open}>
    {#each LANGS as lang (lang)}
      <li>
        <a
          href={href(localize(path, lang))}
          hreflang={LANG_INFO[lang].html}
          lang={LANG_INFO[lang].html}
          aria-current={lang === page.data.lang ? 'true' : undefined}
          onclick={() => (open = false)}>{LANG_INFO[lang].name}</a
        >
      </li>
    {/each}
  </ul>
</div>
