<script lang="ts">
  import { onMount } from 'svelte';
  import { message, Modal, ModalHost, modal, Select, type ModalProps, type SelectValue } from '$lib';

  // The lab of the Modal (specs/modal.md). `window.__modalLab` gives the tests the props of the Modal written in markup (`set`), the
  // static calls (`modal`) and the Message, a log of what the callbacks said, and a long page with a scrollbar behind them.
  let props = $state<ModalProps>({ open: false });
  let lines = $state(3);
  let withSelect = $state(false);
  let rtl = $state(false);
  let host = $state(false);
  let clicks = $state(0);
  let choice = $state<SelectValue | undefined>('one');
  let log = $state<string[]>([]);

  onMount(() => {
    (window as unknown as { __modalLab: unknown }).__modalLab = {
      set(patch: Record<string, unknown>) {
        const { lines: nextLines, withSelect: nextSelect, rtl: nextRtl, host: nextHost, ...rest } = patch;
        if (nextLines !== undefined) lines = nextLines as number;
        if (nextSelect !== undefined) withSelect = nextSelect as boolean;
        if (nextRtl !== undefined) rtl = nextRtl as boolean;
        if (nextHost !== undefined) host = nextHost as boolean;
        props = { ...props, ...rest };
      },
      modal,
      message,
      log: () => [...log],
      clicks: () => clicks,
      choice: () => choice
    };
  });

  const note = (text: string) => (log = [...log, text]);
</script>

<svelte:head>
  <style>
    html { overflow-y: scroll; }
    ::-webkit-scrollbar { width: 15px; }
    ::-webkit-scrollbar-thumb { background: #888; }
  </style>
</svelte:head>

<main dir={rtl ? 'rtl' : 'ltr'} data-testid="page" style="padding: 24px; min-height: 2600px">
  <h1>Modal lab</h1>
  <div data-testid="marker" style="width: 100%; height: 24px; background: #ccd"></div>
  <p>
    <button type="button" data-testid="open" onclick={() => (props = { ...props, open: true })}>Open Modal</button>
    <button type="button" data-testid="page-button" onclick={() => clicks++}>Page button</button>
    <input data-testid="page-input" aria-label="Page input" />
  </p>
  <p data-testid="open-state">{props.open ? 'open' : 'closed'}</p>
</main>

{#snippet body()}
  <div data-testid="body">
    {#each Array.from({ length: lines }, (_, index) => index) as index (index)}
      <p>Body line {index + 1}</p>
    {/each}
    <input data-testid="field" aria-label="Field" />
    {#if withSelect}
      <Select aria-label="Choice" options={['one', 'two', 'three']} bind:value={choice} style="width: 160px" />
    {/if}
  </div>
{/snippet}

{#if host}<ModalHost />{/if}

<Modal
  title="Basic Modal"
  {...props}
  bind:open={props.open}
  oncancel={() => note('cancel')}
  onok={() => note('ok')}
  onafterclose={() => note('afterclose')}
  onafteropenchange={(open) => note(`afteropenchange:${open}`)}
>
  {@render body()}
</Modal>
