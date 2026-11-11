<script lang="ts">
  import { tick } from 'svelte';
  import { createCopier } from '#docs/copy.svelte';
  import { useT } from '#docs/i18n/use-t';
  import { highlight } from '#docs/highlight';
  import Html from './Html.svelte';
  import Icon from './Icon.svelte';

  const commands = [
    { name: 'npm', command: 'npm install svelte-ant-design' },
    { name: 'pnpm', command: 'pnpm add svelte-ant-design' },
    { name: 'yarn', command: 'yarn add svelte-ant-design' },
    { name: 'bun', command: 'bun add svelte-ant-design' }
  ];

  const t = useT();
  let selected = $state(0);
  const copier = createCopier();
  let tabs: HTMLButtonElement[] = [];

  /** Arrow keys, Home and End move between the tabs and bring the focus along (roving tabindex). */
  async function onKeydown(event: KeyboardEvent) {
    const last = commands.length - 1;
    const next =
      event.key === 'ArrowRight' ? (selected + 1) % commands.length
      : event.key === 'ArrowLeft' ? (selected + last) % commands.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    selected = next;
    await tick();
    tabs[next]?.focus();
  }

</script>

<div class="codebox">
  <div class="tabs" role="tablist" aria-label="Package manager">
    {#each commands as item, i (item.name)}
      <button
        type="button"
        role="tab"
        id="pm-tab-{item.name}"
        aria-selected={selected === i}
        aria-controls="pm-panel"
        tabindex={selected === i ? 0 : -1}
        bind:this={tabs[i]}
        onclick={() => (selected = i)}
        onkeydown={onKeydown}>{item.name}</button
      >
    {/each}
  </div>
  <div id="pm-panel" role="tabpanel" aria-labelledby="pm-tab-{commands[selected].name}">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <pre tabindex="0"><code><Html html={highlight(commands[selected].command, 'sh')} /></code></pre>
  </div>
  <button class="icon-btn" type="button" onclick={() => copier.copy(commands[selected].command)} aria-label={t('demo.copy')} title={t('demo.copy')}>
    <Icon name={copier.copied ? 'check' : 'copy'} />
  </button>
  <span class="sr-only" role="status">{copier.copied ? t('copy.done') : copier.failed ? t('copy.failed') : ''}</span>
</div>
