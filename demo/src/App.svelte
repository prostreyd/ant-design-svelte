<script lang="ts">
  import { Button, VERSION } from '$lib';
</script>

{#snippet uploadIcon()}
  <svg viewBox="0 0 16 16">
    <path d="M8 12V2m0 0L4 6m4-4 4 4M2 14h12" />
  </svg>
{/snippet}

<main>
  <h1>Ant Design Svelte</h1>
  <p>Playground — library version {VERSION}.</p>

  <section>
    <h2>Button — types</h2>
    <div class="row">
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
      <Button type="dashed">Dashed</Button>
      <Button type="text">Text</Button>
      <Button type="link">Link</Button>
    </div>
  </section>

  <section>
    <h2>Button — sizes</h2>
    <div class="row">
      <Button type="primary" size="large">Large</Button>
      <Button type="primary">Medium</Button>
      <Button type="primary" size="small">Small</Button>
    </div>
  </section>

  <section>
    <h2>Button — icon placement</h2>
    <div class="row">
      <Button type="primary" icon={uploadIcon}>Upload</Button>
      <Button type="primary" icon={uploadIcon} iconPlacement="end">Upload</Button>
    </div>
  </section>

  <section>
    <h2>Button — states</h2>
    <div class="row">
      <Button type="primary" danger>Danger</Button>
      <Button type="primary" loading>Loading</Button>
      <Button type="primary" disabled>Disabled</Button>
      <Button type="primary" ghost>Ghost</Button>
      <Button href="https://example.com" target="_blank">Link button</Button>
    </div>
    <div class="row block-row">
      <Button type="primary" block>Block button</Button>
    </div>
  </section>
</main>

<style>
  main {
    max-width: 48rem;
    margin: 3rem auto;
    padding: 0 1rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem;
  }

  h2 {
    margin: 2rem 0 0.75rem;
    font-size: 1.125rem;
  }

  p {
    color: #555;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .block-row {
    margin-top: 8px;
  }
</style>
