<script lang="ts">
  import type { FormValidateStatus } from './types.js';

  let { status }: { status: FormValidateStatus } = $props();

  const classes = $derived(`ads-form-feedback ads-form-feedback-${status}`);
</script>

<!-- The icons of `hasFeedback`: a filled circle with a symbol cut into it (the shape tells the status apart from the colour). -->
<span class={classes} aria-hidden="true">
  <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
    {#if status === 'validating'}
      <circle class="spin" cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    {:else}
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      {#if status === 'success'}
        <path d="M4.5 8.3l2.3 2.3 4.7-5" fill="none" stroke="var(--_glyph)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      {:else if status === 'error'}
        <path d="M5.3 5.3l5.4 5.4M10.7 5.3l-5.4 5.4" fill="none" stroke="var(--_glyph)" stroke-width="1.6" stroke-linecap="round" />
      {:else}
        <path d="M8 4.2v4.4" fill="none" stroke="var(--_glyph)" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="8" cy="11.3" r="1" fill="var(--_glyph)" />
      {/if}
    {/if}
  </svg>
</span>

<style>
  .ads-form-feedback {
    --_glyph: var(--ads-color-bg-container);
    display: inline-flex;
    align-items: center;
    flex: none;
    font-size: 14px;
    line-height: 1;
  }

  .ads-form-feedback-success {
    color: var(--ads-form-success-icon);
  }

  .ads-form-feedback-warning {
    color: var(--ads-form-warning-icon);
  }

  .ads-form-feedback-error {
    color: var(--ads-form-error-icon);
  }

  .ads-form-feedback-validating {
    color: var(--ads-color-primary-text);
  }

  .spin {
    transform-origin: 8px 8px;
    stroke-dasharray: 28 10;
    animation: ads-form-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  @keyframes ads-form-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }

  /* In forced-colors mode the system colours replace these; the shapes still tell the statuses apart. */
  @media (forced-colors: active) {
    .ads-form-feedback {
      --_glyph: Canvas;
      color: CanvasText;
    }
  }
</style>
