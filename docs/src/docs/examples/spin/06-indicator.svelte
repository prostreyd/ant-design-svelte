<script lang="ts">
  import { Spin } from 'svelte-ant-design';
</script>

<!--
  An indicator is drawn in a box of the dot size, and its font size is the dot size, so an icon in `em` scales with
  `size`. The Spin does not turn it: this example animates its own icon and keeps still when asked to reduce motion.
-->
{#snippet arc()}
  <svg class="arc" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="3">
    <path d="M12 3a9 9 0 1 0 9 9" stroke-linecap="round" />
  </svg>
{/snippet}

{#snippet dots()}
  <span class="ellipsis">…</span>
{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">indicator: an icon the example turns</span>
    <Spin indicator={arc} description="Loading" />
  </div>

  <div class="field">
    <span class="caption">indicator: a large icon</span>
    <Spin indicator={arc} size="large" aria-label="Loading, large icon" />
  </div>

  <div class="field">
    <span class="caption">indicator: text</span>
    <Spin indicator={dots} aria-label="Loading, text indicator" />
  </div>
</div>

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

  .arc {
    animation: turn 1s linear infinite;
  }

  .ellipsis {
    font-weight: 700;
  }

  @keyframes turn {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .arc {
      animation-duration: 3s;
    }
  }
</style>
