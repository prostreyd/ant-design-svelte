<script lang="ts">
  import { Button, VERSION } from 'svelte-ant-design';
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import CopyButton from '#docs/components/CopyButton.svelte';
  import Icon, { type IconName } from '#docs/components/Icon.svelte';
  import Logo from '#docs/components/Logo.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { componentGroups, componentsIn } from '#docs/pages';
  import { REPO } from '#docs/site';
  import { quickStart } from '#docs/snippets';

  const t = useT();

  const features: { icon: IconName; title: 'f1.t' | 'f3.t' | 'f4.t' | 'f5.t' | 'f6.t' | null; text: 'f1.d' | 'f2.d' | 'f3.d' | 'f4.d' | 'f5.d' | 'f6.d' }[] = [
    { icon: 'cube', title: 'f1.t', text: 'f1.d' },
    { icon: 'code', title: null, text: 'f2.d' },
    { icon: 'circle-check', title: 'f3.t', text: 'f3.d' },
    { icon: 'dots', title: 'f4.t', text: 'f4.d' },
    { icon: 'check', title: 'f5.t', text: 'f5.d' },
    { icon: 'layers', title: 'f6.t', text: 'f6.d' }
  ];

  const planned = { next: componentsIn('next'), later: componentsIn('later') };

  // The ready components come from the page registry, so a component that gets a page appears here by itself.
  const ready = componentGroups.flatMap((group) => group.items).filter((item) => item.phase === 'now' && item.path);
  // The properties shown as chips under a ready component.
  const highlights: Record<string, string[]> = {
    Button: ['type', 'size', 'shape', 'loading', 'danger', 'ghost', 'href'],
    Input: ['value', 'variant', 'status', 'allowClear', 'showCount', 'prefix', 'classNames', 'styles'],
    Checkbox: ['checked', 'indeterminate', 'disabled', 'value', 'options', 'classNames', 'styles'],
    Switch: ['checked', 'onchange', 'size', 'loading', 'disabled', 'classNames', 'styles']
  };
</script>

{#snippet searchIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
{/snippet}

<Seo path="/" />

<main id="main">
  <section class="hero">
    <div class="hero-in">
      <div>
        <p class="eyebrow"><span>{t('hero.eyebrow')} · {VERSION}</span></p>
        <h1 class="display"><T k="hero.t1" /> <em>Svelte 5</em> <T k="hero.t2" /></h1>
        <p class="lead"><T k="hero.lead" /></p>
        <div class="cta">
          <Button type="primary" size="large" href={localHref('/docs/getting-started/')}>{t('hero.cta1')}</Button>
          <Button size="large" href={localHref('/components/button/')}>{t('hero.cta2')}</Button>
        </div>
        <div class="install">
          <code><span class="p" aria-hidden="true">$</span> npm install svelte-ant-design</code>
          <CopyButton text="npm install svelte-ant-design" />
        </div>
      </div>
      <div class="art-wrap">
        <Logo frameOnly />
        <div class="showcase">
          <div class="win-bar" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="row">
            <Button type="primary">Primary</Button><Button>Default</Button><Button type="dashed">Dashed</Button>
          </div>
          <div class="row">
            <Button type="text">Text</Button><Button type="link">Link</Button><Button type="primary" danger>Danger</Button>
          </div>
          <div class="row">
            <Button type="primary" loading>Loading</Button><Button disabled>Disabled</Button>
            <Button type="primary" shape="circle" icon={searchIcon} aria-label="Search" />
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="band" aria-label={t('sign.docs.t')}>
    <div class="wrap two">
      <a class="sign" href={localHref('/docs/')}>
        <h2><T k="sign.docs.t" /></h2><p><T k="sign.docs.d" /></p><span class="go"><T k="sign.docs.go" /></span>
      </a>
      <a class="sign red" href={localHref('/components/')}>
        <h2><T k="sign.comp.t" /></h2><p><T k="sign.comp.d" /></p><span class="go"><T k="sign.comp.go" /></span>
      </a>
    </div>
  </section>

  <section class="band alt">
    <div class="wrap">
      <div class="sec-head"><h2><T k="why.t" /></h2><p><T k="why.s" /></p></div>
      <div class="cards">
        {#each features as feature (feature.text)}
          <div class="card">
            <div class="ico"><Icon name={feature.icon} /></div>
            <h3>{feature.title ? t(feature.title) : 'TypeScript'}</h3>
            <p><T k={feature.text} /></p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <div class="sec-head"><h2><T k="qs.t" /></h2><p><T k="qs.s" /></p></div>
      <div class="split">
        <div class="panel">
          <div class="panel-h">App.svelte</div>
          <CodeBlock code={quickStart.code} kind={quickStart.kind} />
        </div>
        <div class="panel">
          <div class="panel-h">{t('qs.res')}</div>
          <div class="panel-b">
            <Button type="primary" onclick={() => console.log('saved')}>Save</Button>
            <Button danger>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="band alt">
    <div class="wrap">
      <div class="sec-head"><h2><T k="road.t" /></h2><p><T k="road.s" /></p></div>
      <div class="road">
        <div class="card">
          <h3><span>{t('road.now')}</span> <span class="tag ok">{t('tag.ready')}</span></h3>
          {#each ready as item (item.name)}
            <div class="ready-item">
              <p>{item.name}</p>
              <div class="chips">{#each highlights[item.name] ?? [] as name (name)}<span>{name}</span>{/each}</div>
            </div>
          {/each}
        </div>
        <div class="card">
          <h3><span>{t('road.next')}</span> <span class="tag plan">{t('tag.plan')}</span></h3>
          <p><T k="road.next.d" /></p>
          <div class="chips">{#each planned.next as name (name)}<span>{name}</span>{/each}</div>
        </div>
        <div class="card">
          <h3><span>{t('road.later')}</span> <span class="tag plan">{t('tag.plan')}</span></h3>
          <p><T k="road.later.d" /></p>
          <div class="chips">{#each planned.later as name (name)}<span>{name}</span>{/each}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="band sponsor" id="sponsor">
    <div class="wrap">
      <div class="sec-head" style="margin-bottom: 24px"><h2><T k="sp.t" /></h2><p><T k="sp.s" /></p></div>
      <div class="cta">
        <Button type="primary" size="large" href={REPO}>{t('sp.star')}</Button>
        <Button size="large" href="{REPO}/issues">{t('sp.issue')}</Button>
      </div>
    </div>
  </section>
</main>
