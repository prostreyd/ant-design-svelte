<script lang="ts">
  import { Button } from '$lib';

  let clicks = $state(0);
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
  <a id="anchor-target" href="#anchor-target">target</a>
</main>

<output data-testid="clicks">{clicks}</output>

<style>
  main {
    display: grid;
    justify-items: start;
    gap: 12px;
    padding: 24px;
    width: 320px;
  }
</style>
