<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    InputFocusOptions,
    InputProps,
    InputSearchClassNames,
    InputSearchStyles
  } from './types.js';
  import Button from '../Button/Button.svelte';
  import { isProduction } from '../internal/env.js';
  import { classList, styleText } from '../internal/semantic.js';
  import { normalizeSize } from './field.js';
  import Input from './Input.svelte';
  import InputIcon from './InputIcon.svelte';

  type InputSearchProps = Omit<InputProps, 'classNames' | 'styles'> & {
    /** A button after the field: `true` for the search icon, a string or a snippet for its content. */
    enterButton?: boolean | string | Snippet;
    /** Shows a spinner in place of the search icon; the search action is ignored meanwhile. */
    loading?: boolean;
    /** Called on the search icon or button, on Enter, and on the clear button (`source: 'clear'`). */
    onsearch?: (value: string, event: Event, info: { source: 'input' | 'clear' }) => void;
    /** Custom search icon: plain text or a snippet. */
    searchIcon?: string | Snippet;
    /** Extra classes for the parts, with the search `button`. */
    classNames?: InputSearchClassNames;
    /** Inline styles for the parts, with the search `button`. */
    styles?: InputSearchStyles;
  };

  let {
    value = $bindable(''),
    enterButton = false,
    loading = false,
    onsearch,
    searchIcon = undefined,
    size = 'medium',
    disabled = false,
    suffix = undefined,
    addonAfter = undefined,
    onpressenter,
    onclear,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    ...rest
  }: InputSearchProps = $props();

  let inner: ReturnType<typeof Input> | undefined = $state();

  const hasButton = $derived(Boolean(enterButton));

  // The search button and an addon after the field are the same place: both together is a mistake.
  $effect.pre(() => {
    if (hasButton && addonAfter && !isProduction()) {
      throw new TypeError('InputSearch: enterButton conflicts with addonAfter; use one of them.');
    }
  });

  const buttonSize = $derived(normalizeSize(size));

  function search(event: Event, source: 'input' | 'clear'): void {
    if (loading || disabled) return;
    onsearch?.(source === 'clear' ? '' : (value ?? ''), event, { source });
  }

  function handlePressEnter(event: KeyboardEvent): void {
    onpressenter?.(event);
    search(event, 'input');
  }

  function handleClear(event: MouseEvent): void {
    onclear?.(event);
    search(event, 'clear');
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

{#snippet plainGlyph()}
  {#if searchIcon === undefined}
    <InputIcon name="search" />
  {:else if typeof searchIcon === 'string'}
    {searchIcon}
  {:else}
    {@render searchIcon()}
  {/if}
{/snippet}

<!-- The spinner replaces the icon, inside the field and on the icon-only button. -->
{#snippet glyph()}
  {#if loading}
    <InputIcon name="loading" />
  {:else}
    {@render plainGlyph()}
  {/if}
{/snippet}

{#snippet affix()}
  {#if typeof suffix === 'string'}{suffix}{:else if suffix}{@render suffix()}{/if}
  <!-- Without `enterButton` the icon inside the field is the button. -->
  <button
    type="button"
    class="ads-input-search-icon"
    aria-label="Search"
    aria-busy={loading || undefined}
    {disabled}
    onmousedown={(event) => event.preventDefault()}
    onclick={(event) => search(event, 'input')}
  >
    {@render glyph()}
  </button>
{/snippet}

<span
  class={classList('ads-input-search', hasButton && 'ads-input-search-with-button', customClass, classNames?.root)}
  style={styleText(customStyle, styles?.root)}
>
  <Input
    bind:this={inner}
    bind:value
    type="search"
    {...rest}
    {size}
    {disabled}
    class={hasButton ? 'ads-input-has-addon-after' : undefined}
    addonAfter={hasButton ? undefined : addonAfter}
    suffix={hasButton ? suffix : affix}
    onpressenter={handlePressEnter}
    onclear={handleClear}
    classNames={{
      prefix: classNames?.prefix,
      input: classNames?.input,
      suffix: classNames?.suffix,
      clear: classNames?.clear,
      count: classNames?.count
    }}
    styles={{
      prefix: styles?.prefix,
      input: styles?.input,
      suffix: styles?.suffix,
      clear: styles?.clear,
      count: styles?.count
    }}
  />
  {#if hasButton}
    <!--
      The button never gets the `loading` of Button: its spinner would make the button wider. The spinner replaces the
      icon, or sits over the text (which stays, invisible, so the name and the width do not change).
    -->
    {@const common = {
      type: 'primary' as const,
      size: buttonSize,
      disabled,
      class: classList('ads-input-search-button', classNames?.button),
      style: styleText('border-start-start-radius: 0; border-end-start-radius: 0', styles?.button),
      'aria-busy': loading || undefined,
      onclick: (event: MouseEvent) => search(event, 'input')
    }}
    {#if enterButton === true}
      <Button {...common} aria-label="Search" icon={glyph} />
    {:else}
      <Button {...common}>
        <span class="ads-input-search-label">
          <span class={classList('ads-input-search-content', loading && 'ads-input-search-content-busy')}
            >{#if typeof enterButton === 'string'}{enterButton}{:else}{@render (enterButton as Snippet)()}{/if}</span
          >
          {#if loading}
            <span class="ads-input-search-spinner"><InputIcon name="loading" /></span>
          {/if}
        </span>
      </Button>
    {/if}
  {/if}
</span>

<style>
  .ads-input-search {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    vertical-align: top;
  }

  .ads-input-search-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* The text stays (it names the button and sets its width) but is not seen while the spinner is over it. */
  .ads-input-search-content-busy {
    opacity: 0;
  }

  .ads-input-search-spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ads-input-icon-size);
  }

  .ads-input-search-icon {
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

  .ads-input-search-icon:not(:first-child) {
    margin-inline-start: var(--ads-input-gap);
  }

  .ads-input-search-icon:hover:not(:disabled) {
    color: var(--ads-input-icon-color-hover);
  }

  .ads-input-search-icon:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  .ads-input-search-icon:disabled {
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-input-search-icon {
      transition: none;
    }
  }
</style>
