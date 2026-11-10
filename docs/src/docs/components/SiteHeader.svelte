<script lang="ts">
  import { page } from '$app/state';
  import { VERSION } from 'svelte-ant-design';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { logicalPath, sectionOf } from '#docs/pages';
  import { CHANGELOG, REPO } from '#docs/site';
  import Icon from './Icon.svelte';
  import LangMenu from './LangMenu.svelte';
  import Logo from './Logo.svelte';
  import MobileNav from './MobileNav.svelte';
  import Search from './Search.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  const t = useT();
  const section = $derived(sectionOf(logicalPath(page.route.id)));
</script>

<header class="hdr">
  <div class="hdr-in">
    <MobileNav />
    <a class="logo" href={localHref('/')}>
      <Logo /><span>svelte-ant-design</span>
    </a>
    <Search />
    <nav class="nav" aria-label={t('hdr.nav')}>
      <a href={localHref('/docs/')} aria-current={section === 'docs' ? 'true' : undefined} class:active={section === 'docs'}>{t('nav.docs')}</a>
      <a href={localHref('/components/')} aria-current={section === 'components' ? 'true' : undefined} class:active={section === 'components'}>{t('nav.components')}</a>
      <a href={CHANGELOG}>{t('nav.changelog')}</a>
    </nav>
    <div class="hdr-act">
      <span class="chip ver-chip" title={t('hdr.version')}>v{VERSION}</span>
      <LangMenu />
      <ThemeToggle />
      <a class="star" href={REPO}><Icon name="github" /><span>GitHub</span></a>
    </div>
  </div>
</header>
