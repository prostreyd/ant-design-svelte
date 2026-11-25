<script lang="ts">
  import { flushSync } from 'svelte';
  import { Button, Menu, Typography, TypographyLink, TypographyParagraph, TypographyText, TypographyTitle } from '$lib';

  // The lab of the Typography (specs/typography.md): the test hands over one part (`kind`), its props as plain data and its text,
  // and the page mounts a fresh one between two neighbours (`#before`, `#after`) whose position must not move. A callback that the
  // test wants to see is written as `true` in the config (`oncopy: true`) and is logged: `window.__typographyLab.log()`. With
  // `copyable.pending` the text is a promise: each request is logged; with `true` it waits for `window.__typographyLab.answer()`,
  // with a number it answers by itself after so many milliseconds.
  // `asContent` gives the text as `content` (bound), otherwise as a child. `article` puts the part into a `Typography`.
  // The kind `article` draws one sample (plain tags and our own components) twice: inside a `Typography` (`#in`) and outside (`#out`).
  type Kind = 'title' | 'paragraph' | 'text' | 'link' | 'article';
  type Config = {
    kind: Kind;
    props: Record<string, unknown>;
    text: string;
    asContent?: boolean;
    article?: boolean;
    width?: number;
    dir?: 'ltr' | 'rtl';
  };

  const parts = { title: TypographyTitle, paragraph: TypographyParagraph, text: TypographyText, link: TypographyLink };

  let config = $state<Config>({ kind: 'paragraph', props: {}, text: 'Hello' });
  let version = $state(0);
  let content = $state('');
  let editing = $state(false);
  let expanded = $state(false);
  let entries: string[] = [];
  let clicks = 0;
  let answers: (() => void)[] = [];

  const logger = (name: string) => (...args: unknown[]) => {
    const detail = args.find((value) => typeof value === 'string' || typeof value === 'boolean' || (value && typeof value === 'object' && 'expanded' in (value as object)));
    entries.push(detail === undefined ? name : `${name}:${typeof detail === 'object' ? (detail as { expanded: boolean }).expanded : detail}`);
  };

  /** The props with every `true` callback replaced by a logging function. */
  const prepared = $derived.by(() => {
    const props: Record<string, unknown> = { ...config.props };
    for (const key of ['copyable', 'editable', 'ellipsis'] as const) {
      const value = props[key];
      if (value && typeof value === 'object') {
        const copy: Record<string, unknown> = { ...(value as Record<string, unknown>) };
        for (const name of Object.keys(copy)) if (/^on/.test(name) && copy[name] === true) copy[name] = logger(name);
        // `pending` turns the text into a promise of it: `true` waits for `answer()`, a number answers by itself after so many ms.
        if (copy.pending !== undefined) {
          const [text, pending] = [copy.text as string, copy.pending];
          copy.text = () => {
            entries.push('request');
            return new Promise<string>((done) => {
              if (typeof pending === 'number') setTimeout(() => done(text), pending);
              else answers.push(() => done(text));
            });
          };
          delete copy.pending;
        }
        props[key] = copy;
      }
    }
    if (props.onclick === true) props.onclick = () => (clicks += 1);
    delete props.editing;
    delete props.expanded;
    return props;
  });

  const api = {
    log: () => [...entries],
    clear() {
      entries = [];
      clicks = 0;
    },
    clicks: () => clicks,
    answer() {
      for (const answer of answers.splice(0)) answer();
    },
    state: () => ({ editing, expanded, content }),
    set(next: Config) {
      config = next;
      content = next.text;
      editing = Boolean(next.props.editing);
      expanded = Boolean(next.props.expanded);
      entries = [];
      clicks = 0;
      answers = [];
      version += 1;
      flushSync();
    },
    update(patch: Record<string, unknown>) {
      config = { ...config, props: { ...config.props, ...patch } };
      flushSync();
    },
    setText(text: string) {
      config = { ...config, text };
      content = text;
      flushSync();
    }
  };
  (window as unknown as { __typographyLab: typeof api }).__typographyLab = api;
  const Part = $derived(parts[config.kind === 'article' ? 'paragraph' : config.kind]);
  const menu = [
    { key: 'a', label: 'Item' },
    { type: 'group' as const, label: 'Group', children: [{ key: 'b', label: 'In group' }] },
    { type: 'divider' as const }
  ];
</script>

{#snippet text()}{config.text}{/snippet}

{#snippet part()}
  {#if config.asContent}
    <Part {...prepared} bind:content bind:editing bind:expanded />
  {:else}
    <Part {...prepared} bind:editing bind:expanded>{@render text()}</Part>
  {/if}
{/snippet}

{#snippet sample()}
  <h1>Heading 1</h1>
  <h2>Heading 2</h2>
  <h3>Heading 3</h3>
  <h4>Heading 4</h4>
  <h5>Heading 5</h5>
  <ul>
    <li>
      One
      <ul><li>Nested</li></ul>
    </li>
  </ul>
  <ol><li>First</li></ol>
  <blockquote>Quote</blockquote>
  <blockquote><p class="first">Quoted</p><p class="second">Quoted again</p></blockquote>
  <pre><code>pre code</code></pre>
  <p><code>code</code> <kbd>kbd</kbd> <mark>mark</mark> <strong>strong</strong></p>
  <p class="links">
    Text with <a href="#typography">a plain link</a> and
    <!-- svelte-ignore a11y_missing_attribute -->
    <a class="named">an anchor without href</a>.
  </p>
  <p>
    <TypographyLink href="#typography">Own link</TypographyLink>
    <TypographyLink href="#typography" disabled>Disabled link</TypographyLink>
    <Button href="#typography">Link button</Button>
  </p>
  <TypographyTitle level={4}>Own title</TypographyTitle>
  <TypographyTitle level={4} type="secondary">Secondary title</TypographyTitle>
  <TypographyTitle level={4} type="success">Success title</TypographyTitle>
  <TypographyTitle level={4} type="warning">Warning title</TypographyTitle>
  <TypographyTitle level={4} type="danger">Danger title</TypographyTitle>
  <TypographyTitle level={4} disabled>Disabled title</TypographyTitle>
  <TypographyParagraph type="danger">Own paragraph</TypographyParagraph>
  <TypographyParagraph>
    In a part <a class="in-part" href="#typography">a link of a paragraph</a> and
    <!-- svelte-ignore a11y_missing_attribute -->
    <a class="in-part-named">an anchor without href</a>
  </TypographyParagraph>
  <TypographyTitle level={5}><a class="in-title" href="#typography">a link of a title</a></TypographyTitle>
  <TypographyText type="danger"><a class="in-text" href="#typography">a link of a colored text</a></TypographyText>
  <TypographyParagraph disabled><a class="in-disabled" href="#typography">a link of a disabled paragraph</a></TypographyParagraph>
  <Menu items={menu} />
{/snippet}

<main>
  {#key version}
    <div id="host" dir={config.dir} style={config.width ? `width:${config.width}px` : undefined}>
      <p id="before">Before</p>
      {#if config.kind === 'article'}
        <Typography id="in">{@render sample()}</Typography>
        <div id="out">{@render sample()}</div>
      {:else if config.article}
        <Typography>{@render part()}</Typography>
      {:else}
        {@render part()}
      {/if}
      <p id="after">After</p>
    </div>
  {/key}
  <button id="outside" type="button">outside</button>
</main>

<style>
  main {
    padding: 24px;
    font-family: var(--ads-font-family);
  }

  #before,
  #after {
    margin: 0;
  }

  /* The same inherited text as the article, so that only the article's own rules can tell the two samples apart. */
  #out {
    color: var(--ads-typography-color);
    font-size: var(--ads-typography-font-size);
    line-height: var(--ads-typography-line-height);
  }
</style>
