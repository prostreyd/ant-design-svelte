<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { InputFocusOptions, InputProps } from './types.js';
  import Input from './Input.svelte';
  import InputIcon from './InputIcon.svelte';

  type InputPasswordProps = Omit<InputProps, 'type'> & {
    /** Whether the text is shown. Use `bind:visible` for two-way binding; a plain value is the initial state. */
    visible?: boolean;
    /** Shows the toggle button. The object form tunes it: `tabIndex` and the accessible name `label`. */
    visibilityToggle?: boolean | { tabIndex?: number; label?: string };
    /** Called once per user toggle with the new visibility. */
    onvisiblechange?: (visible: boolean) => void;
    /** Custom content of the toggle button, given the current visibility. */
    iconRender?: Snippet<[visible: boolean]>;
  };

  let {
    value = $bindable(''),
    visible = $bindable(false),
    visibilityToggle = true,
    onvisiblechange,
    iconRender,
    suffix = undefined,
    disabled = false,
    ...rest
  }: InputPasswordProps = $props();

  let inner: ReturnType<typeof Input> | undefined = $state();

  const toggleConfig = $derived(typeof visibilityToggle === 'object' ? visibilityToggle : undefined);
  const toggleShown = $derived(visibilityToggle !== false);

  function toggle(): void {
    const next = !visible;
    visible = next;
    onvisiblechange?.(next);
  }

  /** Moves focus to the input; `cursor` places the caret or selects the text. */
  export function focus(options?: InputFocusOptions): void {
    inner?.focus(options);
  }

  /** Removes focus from the input. */
  export function blur(): void {
    inner?.blur();
  }
</script>

{#snippet affix()}
  {#if typeof suffix === 'string'}{suffix}{:else if suffix}{@render suffix()}{/if}
  {#if toggleShown}
    <!-- A native button; a press does not take focus from the field. The name stays, `aria-pressed` follows the state. -->
    <button
      type="button"
      class="ads-input-password-toggle"
      aria-label={toggleConfig?.label ?? 'Show password'}
      aria-pressed={visible}
      tabindex={toggleConfig?.tabIndex}
      {disabled}
      onmousedown={(event) => event.preventDefault()}
      onclick={toggle}
    >
      {#if iconRender}
        {@render iconRender(visible)}
      {:else}
        <InputIcon name={visible ? 'eye' : 'eye-off'} />
      {/if}
    </button>
  {/if}
{/snippet}

<Input
  bind:this={inner}
  bind:value
  {...rest}
  {disabled}
  type={visible ? 'text' : 'password'}
  suffix={suffix || toggleShown ? affix : undefined}
/>

<style>
  .ads-input-password-toggle {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 2px;
    background: transparent;
    color: var(--ads-input-icon-color);
    font: inherit;
    font-size: var(--ads-input-icon-size);
    line-height: 1;
    cursor: pointer;
    transition: color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-input-password-toggle:not(:first-child) {
    margin-inline-start: var(--ads-input-gap);
  }

  .ads-input-password-toggle:hover:not(:disabled) {
    color: var(--ads-input-icon-color-hover);
  }

  .ads-input-password-toggle:disabled {
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  .ads-input-password-toggle:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-input-password-toggle {
      transition: none;
    }
  }
</style>
