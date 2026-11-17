<script lang="ts">
  import { Button, Spin } from 'svelte-ant-design';

  let loading = $state(false);

  function show() {
    loading = true;
    setTimeout(() => (loading = false), 3000);
  }
</script>

<div class="stack">
  <div class="field">
    <span class="caption">fullscreen: a dimmed backdrop over the viewport, for three seconds</span>
    <!--
      The backdrop is drawn where the component is (position: fixed), so put it near the root of the application, not
      inside an element with a transform. It has no focus trap: Tab still reaches the page behind it.
    -->
    <Button disabled={loading} onclick={show}>Show fullscreen</Button>
    <span>spinning is {loading}</span>
  </div>
</div>

<Spin fullscreen spinning={loading} description="Loading the page" />

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
