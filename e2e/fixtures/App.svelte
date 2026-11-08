<script lang="ts">
  import { Button } from '$lib';

  let clicks = $state(0);
  let busy = $state(false);

  const types = ['default', 'primary', 'dashed', 'text', 'link'] as const;
</script>

<main>
  <Button data-testid="default" onclick={() => clicks++}>Default</Button>
  <Button data-testid="primary" type="primary" onclick={() => clicks++}>Primary</Button>
  <Button data-testid="dashed" type="dashed" onclick={() => clicks++}>Dashed</Button>
  <Button data-testid="text" type="text" onclick={() => clicks++}>Text</Button>
  <Button data-testid="link" type="link" onclick={() => clicks++}>Link type</Button>
  <Button data-testid="danger-primary" type="primary" danger onclick={() => clicks++}>Danger</Button>
  <Button data-testid="ghost-primary" type="primary" ghost onclick={() => clicks++}>Ghost</Button>
  <Button data-testid="block" block onclick={() => clicks++}>Block</Button>
  <Button data-testid="circle" shape="circle" aria-label="Circle">+</Button>
  <Button data-testid="round" shape="round" onclick={() => clicks++}>Round</Button>
  <Button data-testid="small" size="small" onclick={() => clicks++}>Small</Button>
  <Button data-testid="large" size="large" onclick={() => clicks++}>Large</Button>
  <Button data-testid="disabled" disabled onclick={() => clicks++}>Disabled</Button>
  <Button data-testid="loading" loading onclick={() => clicks++}>Loading</Button>
  <Button data-testid="anchor" href="#anchor-target">Anchor</Button>
  <Button data-testid="anchor-disabled" href="#anchor-target" disabled>Disabled anchor</Button>
  <Button data-testid="load-toggle" loading={busy} onclick={() => (busy = true)}>Start</Button>
  <a id="anchor-target" href="#anchor-target">target</a>
</main>

<!-- Every type x danger x ghost combination, used by the contrast matrix tests. -->
<section data-testid="matrix">
  {#each types as type (type)}
    {#each [false, true] as danger (danger)}
      {#each [false, true] as ghost (ghost)}
        <Button
          data-testid="m-{type}-{danger ? 'danger' : 'plain'}-{ghost ? 'ghost' : 'solid'}"
          {type}
          {danger}
          {ghost}>{type}</Button
        >
      {/each}
    {/each}
  {/each}
</section>

<output data-testid="clicks">{clicks}</output>

<style>
  :global(body) {
    background: var(--ads-color-bg-container);
  }

  section {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 24px;
    width: 640px;
  }

  main {
    display: grid;
    justify-items: start;
    gap: 12px;
    padding: 24px;
    width: 320px;
  }
</style>
