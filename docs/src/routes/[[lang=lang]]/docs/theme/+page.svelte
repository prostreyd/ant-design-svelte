<script lang="ts">
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { localHref } from '#docs/href';
  import type { Key } from '#docs/i18n';
  import { useT } from '#docs/i18n/use-t';
  import { accessibleTokens, themeOverride } from '#docs/snippets';

  const t = useT();
  const groups: { group: Key; example: string; description: Key }[] = [
    { group: 'g.colors', example: '--ads-color-primary-solid', description: 'g.colors.d' },
    { group: 'g.sizes', example: '--ads-control-height', description: 'g.sizes.d' },
    { group: 'g.radius', example: '--ads-radius-md', description: 'g.radius.d' },
    { group: 'g.type', example: '--ads-font-size', description: 'g.type.d' },
    { group: 'g.motion', example: '--ads-motion-duration', description: 'g.motion.d' }
  ];
</script>

<Seo path="/docs/theme/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.theme') }]} />
<h1><T k="d.theme" /></h1>
<p class="lede"><T k="theme.lead" /></p>

<h2 id="override"><T k="theme.h.override" /></h2>
<p><T k="theme.override" /></p>
<CodeBlock code={themeOverride.code} kind={themeOverride.kind} />
<p><T k="theme.dark.note" /></p>

<h2 id="groups"><T k="theme.h.groups" /></h2>
<TableWrap labelledby="groups">
  <table class="api plain" aria-labelledby="groups">
    <thead>
      <tr><th scope="col">{t('th.group')}</th><th scope="col">{t('th.example')}</th><th scope="col">{t('th.desc')}</th></tr>
    </thead>
    <tbody>
      {#each groups as row (row.group)}
        <tr><td>{t(row.group)}</td><td class="df">{row.example}</td><td>{t(row.description)}</td></tr>
      {/each}
    </tbody>
  </table>
</TableWrap>

<h2 id="contrast"><T k="theme.h.contrast" /></h2>
<p><T k="theme.contrast" /></p>
<CodeBlock code={accessibleTokens.code} kind={accessibleTokens.kind} />
