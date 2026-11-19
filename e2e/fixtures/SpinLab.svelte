<script lang="ts">
  import { flushSync, type ComponentProps } from 'svelte';
  import { Spin } from '$lib';

  // The lab of the Spin (specs/spin.md): the test hands over the props and what the Spin covers, and the page mounts a
  // fresh Spin (a new mount, so that the first paint can be measured). `window.__spinLab.update` changes props of the
  // mounted one. The `host` has a width of its own, `before` and `after` are neighbours whose position must not move,
  // and `outside` is a button the page keeps behind a fullscreen backdrop.
  type Content = 'none' | 'text' | 'button' | 'wide' | 'nested';
  type Lab = { props: ComponentProps<typeof Spin>; content: Content; dir?: 'ltr' | 'rtl'; custom?: boolean };

  let lab = $state<Lab>({ props: {}, content: 'none' });
  let version = $state(0);
  let clicks = $state(0);

  const api = {
    clicks: () => clicks,
    mountedAt: 0,
    appearedAt: 0,
    set(next: Lab) {
      lab = next;
      clicks = 0;
      api.appearedAt = 0;
      // The first time a status element is inserted is when the indicator appeared.
      const watcher = new MutationObserver(() => {
        if (!api.appearedAt && document.querySelector('[role="status"]')) {
          api.appearedAt = performance.now();
          watcher.disconnect();
        }
      });
      watcher.observe(document.body, { childList: true, subtree: true });
      api.mountedAt = performance.now();
      version += 1;
      flushSync();
    },
    update(patch: Partial<ComponentProps<typeof Spin>>) {
      lab = { ...lab, props: { ...lab.props, ...patch } };
      flushSync();
    }
  };
  (window as unknown as { __spinLab: typeof api }).__spinLab = api;
  document.body.style.background = 'var(--ads-color-bg-container)';
  document.body.style.color = 'var(--ads-color-text)';
</script>

{#snippet text()}
  <div data-testid="content" class="content">
    <button type="button" data-testid="inner-button" onclick={() => (clicks += 1)}>Save</button>
    <p>Rows that load</p>
  </div>
{/snippet}
{#snippet nested()}
  <div data-testid="content" class="content">
    <Spin data-testid="inner" description="Inner" />
    <p>Outer rows</p>
  </div>
{/snippet}
{#snippet custom()}
  <svg data-testid="custom-indicator" viewBox="0 0 10 10" width="1em" height="1em"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
{/snippet}
{#snippet wide()}
  <div data-testid="content" class="content wide">A considerably longer line of content that is wider than the short one</div>
{/snippet}

<div data-testid="host" class="host" dir={lab.dir}>
  <p data-testid="before">Before</p>
  {#key version}
    <Spin
      data-testid="spin"
      {...lab.props}
      indicator={lab.custom ? custom : undefined}
      children={lab.content === 'text' || lab.content === 'button'
        ? text
        : lab.content === 'wide'
          ? wide
          : lab.content === 'nested'
            ? nested
            : undefined}
    />
  {/key}
  <p data-testid="after">After</p>
  <button type="button" data-testid="outside">Outside</button>
</div>

<style>
  .host {
    width: 360px;
    margin: 16px;
    font-family: sans-serif;
  }

  .content {
    box-sizing: border-box;
    height: 120px;
    padding: 12px;
    background: #f0f0f0;
    color: #000;
  }

  .wide {
    height: 80px;
  }

  p {
    margin: 8px 0;
  }
</style>
