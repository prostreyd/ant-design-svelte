<script lang="ts">
  import type { Component } from 'svelte';
  import { highlight } from '#docs/highlight';
  import { useT } from '#docs/i18n/use-t';
  import Html from './Html.svelte';
  import Icon from './Icon.svelte';

  /** One example: the live component, its description, and the code that the live component was built from. */
  let {
    id,
    title,
    description,
    code,
    example: Example,
    surface = false,
    column = false
  }: {
    id: string;
    title: string;
    description: string;
    code: string;
    example: Component;
    surface?: boolean;
    column?: boolean;
  } = $props();

  const t = useT();
  let open = $state(false);
  let copied = $state(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* the clipboard may be unavailable */
    }
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<section class="demo" class:open aria-labelledby="demo-{id}">
  <div class="demo-pre" class:surface class:col={column}>
    <Example />
  </div>
  <div class="demo-meta">
    <h3 class="demo-title" id="demo-{id}">{title}</h3>
    <p class="demo-desc"><Html html={description} /></p>
  </div>
  <div class="demo-act">
    <button
      class="icon-btn"
      type="button"
      aria-expanded={open}
      aria-controls="code-{id}"
      aria-label={open ? t('demo.hide') : t('demo.show')}
      title={open ? t('demo.hide') : t('demo.show')}
      onclick={() => (open = !open)}
    >
      <Icon name="code" />
    </button>
    <button class="icon-btn" type="button" aria-label={t('demo.copy')} title={t('demo.copy')} onclick={copyCode}>
      <Icon name={copied ? 'check' : 'copy'} />
    </button>
    <span class="sr-only" role="status">{copied ? t('copy.done') : ''}</span>
  </div>
  <div class="demo-code" id="code-{id}" hidden={!open}>
    <!-- Long lines scroll sideways, so keyboard users need to be able to focus the block. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <pre tabindex="0"><code><Html html={highlight(code, 'svelte')} /></code></pre>
  </div>
</section>
