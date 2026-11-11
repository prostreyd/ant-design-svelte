<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { InputFocusOptions, InputProps } from './types.js';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';
  import {
    INPUT_SIZES,
    INPUT_VARIANTS,
    clipText,
    countText,
    focusField,
    isOverLimit,
    normalizeSize,
    resolveCount,
    resolveStatus
  } from './field.js';
  import ClearButton from './ClearButton.svelte';

  let {
    value = $bindable(''),
    type = 'text',
    disabled = false,
    readonly = false,
    size = 'medium',
    variant = 'outlined',
    status = undefined,
    prefix = undefined,
    suffix = undefined,
    addonBefore = undefined,
    addonAfter = undefined,
    allowClear = false,
    showCount = false,
    count = undefined,
    maxlength = undefined,
    onchange,
    onpressenter,
    onclear,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    oninput,
    onkeydown,
    oncompositionstart,
    oncompositionend,
    'aria-describedby': ariaDescribedby = undefined,
    'aria-invalid': ariaInvalid = undefined,
    ...rest
  }: InputProps = $props();

  const countId = $props.id();

  let input: HTMLInputElement | undefined = $state();
  // Whether an IME composition is open: the edits are reported as they come, but the text is not cut,
  // written back or taken for an Enter until the composition ends.
  let composing = false;

  // The text; a value that is not a string (`null`, from a loose caller) is empty.
  const text = $derived(value ?? '');

  // Every option is validated on each render: a value outside the contract throws while developing and
  // falls back to the default in a production build.
  const resolved = $derived({
    size: normalizeSize(resolveOption('Input', 'size', size, INPUT_SIZES, 'medium')),
    variant: resolveOption('Input', 'variant', variant, INPUT_VARIANTS, 'outlined'),
    status: resolveStatus('Input', status)
  });

  const counting = $derived(resolveCount(showCount, count, maxlength));
  const overLimit = $derived(counting.show && isOverLimit(counting, text));
  const clearConfig = $derived(typeof allowClear === 'object' ? allowClear : undefined);
  const clearVisible = $derived(text !== '' && !disabled && !readonly);

  const describedBy = $derived(
    [ariaDescribedby, counting.show ? countId : undefined].filter(Boolean).join(' ') || undefined
  );

  // The classes that set the look (size, variant, status, state). They go on the field and, when there are
  // addons, on the group too, so the addons read the same colors and sizes.
  const lookClass = $derived(
    classList(
      `ads-input-${resolved.size}`,
      `ads-input-${resolved.variant}`,
      resolved.status && `ads-input-status-${resolved.status}`,
      disabled && 'ads-input-disabled',
      readonly && 'ads-input-readonly',
      addonBefore && 'ads-input-has-addon-before',
      addonAfter && 'ads-input-has-addon-after'
    )
  );
  const rootClass = $derived(classList(customClass, classNames?.root));
  const grouped = $derived(Boolean(addonBefore || addonAfter));

  /** Whether the field is marked invalid: the `error` status, or a text past the soft limit. */
  const invalid = $derived(resolved.status === 'error' || overLimit);

  // A native form reset puts the input back to its default text behind the state's back. The state is the
  // truth (the parent resets it in `onreset`), so the view is restored to it once the reset has run.
  $effect(() => {
    const form = input?.form;
    if (!form) return;
    const restore = () => {
      setTimeout(() => {
        if (input && input.value !== text) input.value = text;
      });
    };
    form.addEventListener('reset', restore);
    return () => form.removeEventListener('reset', restore);
  });

  /**
   * Takes the text of the input into `value`. With `settle` the text is cut by `count.exceedFormatter` and the
   * input is written back from the state, which reverts an edit the parent refused (a function binding).
   */
  function takeEdit(target: HTMLInputElement, event: Event, settle: boolean): void {
    const before = text;
    let next = target.value;
    if (settle) next = clipText(counting, next);
    if (next !== before) {
      value = next;
      onchange?.(next, event);
    }
    if (settle && target.value !== text) target.value = text;
  }

  function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
    oninput?.(event);
    takeEdit(event.currentTarget, event, !composing);
  }

  function handleCompositionStart(
    event: CompositionEvent & { currentTarget: EventTarget & HTMLInputElement }
  ): void {
    composing = true;
    oncompositionstart?.(event);
  }

  function handleCompositionEnd(
    event: CompositionEvent & { currentTarget: EventTarget & HTMLInputElement }
  ): void {
    composing = false;
    oncompositionend?.(event);
    takeEdit(event.currentTarget, event, true);
  }

  function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }): void {
    onkeydown?.(event);
    if (event.key === 'Enter' && !composing && !event.isComposing) onpressenter?.(event);
  }

  function clear(event: MouseEvent): void {
    value = '';
    onchange?.('', event);
    if (input && input.value !== text) input.value = text;
    input?.focus();
    onclear?.(event);
  }

  /** Moves focus to the input; `cursor` places the caret or selects the text. */
  export function focus(options?: InputFocusOptions): void {
    focusField(input, options);
  }

  /** Removes focus from the input. */
  export function blur(): void {
    input?.blur();
  }
</script>

{#snippet content(node: string | Snippet)}
  {#if typeof node === 'string'}{node}{:else}{@render node()}{/if}
{/snippet}

<!--
  The field is one element: the bordered box that holds the prefix, the input, the clear button, the count and
  the suffix. Those are siblings of the input, so showing or hiding one never re-creates the input (it keeps
  focus and caret). Only the addons need a second element, the group that joins them to the field; it exists
  while at least one addon is set.
-->
{#snippet field(extraClass?: string, extraStyle?: string)}
  <span class={classList('ads-input', lookClass, extraClass)} style={extraStyle}>
    {#if prefix}
      <span class={classList('ads-input-prefix', classNames?.prefix)} style={styleText(styles?.prefix)}
        >{@render content(prefix)}</span
      >
    {/if}
    <input
      {...rest}
      bind:this={input}
      {type}
      class={classList('ads-input-input', classNames?.input)}
      style={styleText(styles?.input)}
      value={text}
      {disabled}
      {readonly}
      {maxlength}
      aria-invalid={invalid ? 'true' : ariaInvalid}
      aria-describedby={describedBy}
      oninput={handleInput}
      onkeydown={handleKeydown}
      oncompositionstart={handleCompositionStart}
      oncompositionend={handleCompositionEnd}
    />
    {#if allowClear}
      <ClearButton
        config={clearConfig}
        visible={clearVisible}
        class={classNames?.clear}
        style={styleText(styles?.clear)}
        onclear={clear}
      />
    {/if}
    {#if counting.show}
      <span
        id={countId}
        class={classList('ads-input-count', overLimit && 'ads-input-count-exceeded', classNames?.count)}
        style={styleText(styles?.count)}>{countText(counting, text)}</span
      >
    {/if}
    {#if suffix}
      <span class={classList('ads-input-suffix', classNames?.suffix)} style={styleText(styles?.suffix)}
        >{@render content(suffix)}</span
      >
    {/if}
  </span>
{/snippet}

{#if grouped}
  <span class={classList('ads-input-group', lookClass, rootClass)} style={styleText(customStyle, styles?.root)}>
    {#if addonBefore}
      <span class="ads-input-addon ads-input-addon-before">{@render content(addonBefore)}</span>
    {/if}
    {@render field()}
    {#if addonAfter}
      <span class="ads-input-addon ads-input-addon-after">{@render content(addonAfter)}</span>
    {/if}
  </span>
{:else}
  {@render field(rootClass, styleText(customStyle, styles?.root))}
{/if}

<style>
  /*
   * The states set private `--_*` variables; the rules that paint the field read them, so the variant, the
   * status, hover, focus and disabled combine without fighting over specificity. The values come from the
   * `--ads-input-*` tokens. Positions use logical properties, so the field mirrors in right-to-left layouts.
   */
  /*
   * The group joins the addons to the field and exists only while an addon is set. It carries the look classes
   * too, so the addons read the same variables as the field. It comes before the shared block: the classes of
   * the look (size, status, ...) set the variables again after these defaults.
   */
  .ads-input-group {
    --_fs: var(--ads-input-font-size);
    --_lh: var(--ads-input-line-height);
    --_radius: var(--ads-input-radius);
    --_border: var(--ads-input-border);

    display: inline-flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    margin: 0;
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    vertical-align: top;
  }

  /* shared-field-styles:begin (the same block is in InputTextArea.svelte; tests/internal.test.ts keeps the copies equal) */
  .ads-input {
    --_fs: var(--ads-input-font-size);
    --_lh: var(--ads-input-line-height);
    --_pb: var(--ads-input-padding-block);
    --_pi: var(--ads-input-padding-inline);
    --_radius: var(--ads-input-radius);
    --_border: var(--ads-input-border);
    --_border-hover: var(--ads-input-border-hover);
    --_border-active: var(--ads-input-border-active);
    --_bg: var(--ads-input-bg);
    --_bg-hover: var(--ads-input-bg-hover);
    --_bg-active: var(--ads-input-bg-active);
    --_shadow: var(--ads-input-shadow-active);

    position: relative;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding-block: var(--_pb);
    padding-inline: var(--_pi);
    border: var(--ads-input-border-width) solid var(--_border);
    border-radius: var(--_radius);
    background-color: var(--_bg);
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--_fs);
    line-height: var(--_lh);
    vertical-align: top;
    transition:
      border-color var(--ads-motion-duration) var(--ads-motion-ease),
      background-color var(--ads-motion-duration) var(--ads-motion-ease),
      box-shadow var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-input-large {
    --_fs: var(--ads-input-font-size-lg);
    --_lh: var(--ads-input-line-height-lg);
    --_pb: var(--ads-input-padding-block-lg);
    --_pi: var(--ads-input-padding-inline-lg);
    --_radius: var(--ads-input-radius-lg);
  }

  .ads-input-small {
    --_fs: var(--ads-input-font-size-sm);
    --_pb: var(--ads-input-padding-block-sm);
    --_pi: var(--ads-input-padding-inline-sm);
    --_radius: var(--ads-input-radius-sm);
  }

  .ads-input-filled {
    --_border: transparent;
    --_border-hover: transparent;
    --_bg: var(--ads-input-filled-bg);
    --_bg-hover: var(--ads-input-filled-bg-hover);
  }

  .ads-input-borderless {
    --_border: transparent;
    --_border-hover: transparent;
    --_border-active: transparent;
    --_bg: transparent;
    --_bg-hover: transparent;
    --_bg-active: transparent;
    --_shadow: none;
  }

  .ads-input-underlined {
    --_bg: transparent;
    --_bg-hover: transparent;
    --_bg-active: transparent;
    --_pi: 0px;
    --_shadow: none;
  }

  .ads-input-status-error {
    --_border: var(--ads-input-error);
    --_border-hover: var(--ads-input-error-hover);
    --_border-active: var(--ads-input-error);
    --_shadow: var(--ads-input-error-shadow);
  }

  .ads-input-status-warning {
    --_border: var(--ads-input-warning);
    --_border-hover: var(--ads-input-warning-hover);
    --_border-active: var(--ads-input-warning);
    --_shadow: var(--ads-input-warning-shadow);
  }

  .ads-input-filled.ads-input-status-error {
    --_border: transparent;
    --_border-hover: transparent;
    --_bg: var(--ads-input-error-bg);
    --_bg-hover: var(--ads-input-error-bg);
  }

  .ads-input-filled.ads-input-status-warning {
    --_border: transparent;
    --_border-hover: transparent;
    --_bg: var(--ads-input-warning-bg);
    --_bg-hover: var(--ads-input-warning-bg);
  }

  /* Last, so the disabled colors win over the variant and the status. */
  .ads-input-disabled {
    --_border: var(--ads-input-disabled-border);
    --_border-hover: var(--ads-input-disabled-border);
    --_bg: var(--ads-input-disabled-bg);
    --_bg-hover: var(--ads-input-disabled-bg);
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  .ads-input-disabled.ads-input-borderless,
  .ads-input-disabled.ads-input-underlined {
    --_bg: transparent;
    --_bg-hover: transparent;
  }

  .ads-input-disabled.ads-input-borderless {
    --_border: transparent;
    --_border-hover: transparent;
  }

  .ads-input.ads-input-underlined {
    border-width: 0 0 var(--ads-input-border-width);
    border-radius: 0;
  }

  .ads-input:not(.ads-input-disabled):hover {
    border-color: var(--_border-hover);
    background-color: var(--_bg-hover);
  }

  /* As specific as the hover rule above and after it, so a focused field under the pointer keeps the active look. */
  .ads-input:not(.ads-input-disabled):focus-within {
    border-color: var(--_border-active);
    background-color: var(--_bg-active);
    box-shadow: var(--_shadow);
  }

  /* The borderless field has no border to change, so keyboard focus gets the outline of the other controls. */
  .ads-input.ads-input-borderless:focus-within {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 0;
  }
  /* shared-field-styles:end */

  .ads-input-group > .ads-input {
    flex: 1 1 auto;
    width: auto;
  }

  .ads-input.ads-input-has-addon-before {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  .ads-input.ads-input-has-addon-after {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  .ads-input-addon {
    display: flex;
    flex: none;
    align-items: center;
    box-sizing: border-box;
    padding-inline: var(--ads-input-addon-padding-inline);
    border: var(--ads-input-border-width) solid var(--_border);
    background-color: var(--ads-input-addon-bg);
    font-size: var(--_fs);
    line-height: var(--_lh);
    white-space: nowrap;
  }

  .ads-input-addon-before {
    border-inline-end: 0;
    border-start-start-radius: var(--_radius);
    border-end-start-radius: var(--_radius);
  }

  .ads-input-addon-after {
    border-inline-start: 0;
    border-start-end-radius: var(--_radius);
    border-end-end-radius: var(--_radius);
  }

  .ads-input-input {
    flex: 1 1 auto;
    box-sizing: border-box;
    min-width: 0;
    height: calc(var(--_fs) * var(--_lh));
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--_fs);
    line-height: var(--_lh);
    text-overflow: ellipsis;
  }

  .ads-input-input::placeholder {
    color: var(--ads-input-placeholder);
    opacity: 1;
  }

  .ads-input-disabled .ads-input-input {
    cursor: not-allowed;
    opacity: 1;
    -webkit-text-fill-color: currentColor;
  }

  /* The clear button of the library replaces the browser's own cross in a search field. */
  .ads-input-input::-webkit-search-cancel-button,
  .ads-input-input::-webkit-search-decoration {
    appearance: none;
    display: none;
  }

  .ads-input-prefix,
  .ads-input-suffix,
  .ads-input-count {
    display: flex;
    flex: none;
    align-items: center;
  }

  .ads-input-prefix {
    margin-inline-end: var(--ads-input-gap);
  }

  .ads-input-suffix {
    margin-inline-start: var(--ads-input-gap);
  }

  .ads-input-count {
    margin-inline-start: var(--ads-input-gap);
    color: var(--ads-input-count-color);
    white-space: nowrap;
  }

  .ads-input-count-exceeded {
    color: var(--ads-color-danger-text);
  }

  .ads-input-disabled .ads-input-count {
    color: var(--ads-color-text-disabled);
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-input {
      transition: none;
    }
  }
</style>
