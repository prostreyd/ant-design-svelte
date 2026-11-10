<script lang="ts">
  import { Button, Switch } from '$lib';

  let clicks = $state(0);
  let busy = $state(false);
  let switchBusy = $state(false);
  let switchChanges = $state(0);

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

{#snippet on()}On{/snippet}
{#snippet off()}Off{/snippet}

<!-- Switch states, used by the Switch visual and contrast tests. -->
<section data-testid="switches">
  <Switch data-testid="sw-off" aria-label="Off" />
  <Switch data-testid="sw-on" aria-label="On" checked />
  <Switch data-testid="sw-small-off" aria-label="Small off" size="small" />
  <Switch data-testid="sw-small-on" aria-label="Small on" size="small" checked />
  <Switch
    data-testid="sw-text-off"
    aria-label="Text off"
    checkedChildren={on}
    unCheckedChildren={off}
  />
  <Switch
    data-testid="sw-text-on"
    aria-label="Text on"
    checked
    checkedChildren={on}
    unCheckedChildren={off}
  />
  <Switch data-testid="sw-disabled" aria-label="Disabled" disabled />
  <Switch data-testid="sw-disabled-on" aria-label="Disabled on" disabled checked />
  <Switch data-testid="sw-loading" aria-label="Loading" loading />
  <Switch
    data-testid="sw-start-loading"
    aria-label="Start loading"
    loading={switchBusy}
    onchange={() => {
      switchChanges++;
      switchBusy = true;
    }}
  />
</section>
<output data-testid="switch-changes">{switchChanges}</output>

<!--
  Contents of different widths: toggling must not change the width or move the neighbours.
  One pair is given as snippets, the others as plain strings.
-->
<section data-testid="width-demo">
  <Switch data-testid="sw-onoff" aria-label="On or off" checkedChildren={on} unCheckedChildren={off} />
  <Switch data-testid="sw-yesno" aria-label="Yes or no" checkedChildren="Yes" unCheckedChildren="No" />
  <Switch data-testid="sw-happy" aria-label="Happy or sad" checkedChildren="Happy" unCheckedChildren="Sad" />
  <Switch
    data-testid="sw-happy-small"
    aria-label="Small, happy or sad"
    size="small"
    checkedChildren="Happy"
    unCheckedChildren="Sad"
  />
  <Switch data-testid="sw-only-on" aria-label="Only the on text" checkedChildren="Happy" />
  <Switch data-testid="sw-only-off" aria-label="Only the off text" unCheckedChildren="Sad" />
  <span data-testid="width-after">after</span>
</section>

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
