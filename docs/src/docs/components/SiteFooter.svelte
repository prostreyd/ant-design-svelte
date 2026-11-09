<script lang="ts">
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { CHANGELOG, NPM, REPO } from '#docs/site';
  import Logo from './Logo.svelte';
  import T from './T.svelte';

  const t = useT();
</script>

<footer class="ftr">
  <div class="ftr-in">
    <div>
      <a class="logo" href={localHref('/')}><Logo /><span>svelte-ant-design</span></a>
      <p class="about"><T k="ft.about" /></p>
    </div>
    <div>
      <h2>{t('ft.res')}</h2>
      <a href={localHref('/docs/')}>{t('nav.docs')}</a>
      <a href={localHref('/components/')}>{t('nav.components')}</a>
      <a href={CHANGELOG}>{t('nav.changelog')}</a>
      <a href={NPM}>npm</a>
    </div>
    <div>
      <h2>{t('ft.comm')}</h2>
      <a href={REPO}>GitHub</a>
      <a href="{REPO}/issues">Issues</a>
      <a href={localHref('/') + '#sponsor'}>{t('ft.sponsor')}</a>
    </div>
    <div>
      <h2>{t('ft.proj')}</h2>
      <a href="{REPO}/blob/main/LICENSE">{t('ft.license')}</a>
      <a href={localHref('/docs/contributing/')}>{t('d.contrib')}</a>
      <a href="https://ant.design/docs/spec/introduce">{t('ft.antd')}</a>
    </div>
  </div>
  <div class="ftr-base"><T k="ft.base" /></div>
</footer>
