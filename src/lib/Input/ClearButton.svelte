<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { AllowClearConfig } from './types.js';
  import InputIcon from './InputIcon.svelte';

  let {
    config,
    visible,
    class: extraClass,
    style,
    onclear
  }: {
    /** The object form of `allowClear`, if there is one. */
    config: AllowClearConfig | undefined;
    /** Whether there is something to clear. The button keeps its place in the layout either way. */
    visible: boolean;
    /** Extra classes (the `clear` part of `classNames`); the component's own are static. */
    class: string | undefined;
    style: string | undefined;
    onclear: (event: MouseEvent) => void;
  } = $props();

  const icon: string | Snippet | undefined = $derived(config?.clearIcon);
</script>

<!--
  A native button. While there is nothing to clear it is hidden with `visibility`, which keeps its space (the
  field does not change size when the text appears) and takes it out of the Tab order and the accessibility
  tree. A press does not take focus from the field.
-->
<button
  type="button"
  class="ads-input-clear {extraClass}"
  {style}
  class:ads-input-clear-hidden={!visible}
  aria-label={config?.label ?? 'Clear'}
  tabindex={config?.tabIndex}
  onmousedown={(event) => event.preventDefault()}
  onclick={onclear}
>
  {#if icon === undefined}
    <InputIcon name="clear" />
  {:else if typeof icon === 'string'}
    {icon}
  {:else}
    {@render icon()}
  {/if}
</button>

<style>
  .ads-input-clear {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0;
    margin-inline-start: var(--ads-input-gap);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ads-input-icon-color);
    font: inherit;
    font-size: var(--ads-input-icon-size);
    line-height: 1;
    cursor: pointer;
    transition: color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-input-clear:hover {
    color: var(--ads-input-icon-color-hover);
  }

  .ads-input-clear:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  .ads-input-clear-hidden {
    visibility: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-input-clear {
      transition: none;
    }
  }
</style>
