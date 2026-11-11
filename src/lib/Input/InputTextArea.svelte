<script lang="ts">
  import { tick } from 'svelte';
  import type { InputFocusOptions, InputTextAreaProps } from './types.js';
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
    disabled = false,
    readonly = false,
    size = 'medium',
    variant = 'outlined',
    status = undefined,
    allowClear = false,
    showCount = false,
    count = undefined,
    maxlength = undefined,
    autoSize = false,
    rows = undefined,
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
  }: InputTextAreaProps = $props();

  const countId = $props.id();

  let area: HTMLTextAreaElement | undefined = $state();
  // The height and the scrolling that `autoSize` worked out; written into the style of the textarea.
  let fitted: { height: number; scroll: boolean } | undefined = $state();
  // Whether an IME composition is open (see Input).
  let composing = false;

  const text = $derived(value ?? '');

  const resolved = $derived({
    size: normalizeSize(resolveOption('InputTextArea', 'size', size, INPUT_SIZES, 'medium')),
    variant: resolveOption('InputTextArea', 'variant', variant, INPUT_VARIANTS, 'outlined'),
    status: resolveStatus('InputTextArea', status)
  });

  const counting = $derived(resolveCount(showCount, count, maxlength));
  const overLimit = $derived(counting.show && isOverLimit(counting, text));
  const clearConfig = $derived(typeof allowClear === 'object' ? allowClear : undefined);
  const clearVisible = $derived(text !== '' && !disabled && !readonly);
  const invalid = $derived(resolved.status === 'error' || overLimit);
  const describedBy = $derived(
    [ariaDescribedby, counting.show ? countId : undefined].filter(Boolean).join(' ') || undefined
  );

  const rootClass = $derived(
    classList(
      'ads-input',
      'ads-input-multiline',
      `ads-input-${resolved.size}`,
      `ads-input-${resolved.variant}`,
      resolved.status && `ads-input-status-${resolved.status}`,
      disabled && 'ads-input-disabled',
      readonly && 'ads-input-readonly',
      customClass,
      classNames?.root
    )
  );

  const areaStyle = $derived(
    styleText(
      autoSize && fitted && { height: `${fitted.height}px`, 'overflow-y': fitted.scroll ? 'auto' : 'hidden' },
      styles?.textarea
    )
  );

  /**
   * `autoSize`: sets the height to that of the content, within `minRows` and `maxRows` lines of the current
   * line height. The height is measured with the height released, then written back.
   */
  function fit(): void {
    const element = area;
    if (!element || !autoSize) {
      fitted = undefined;
      return;
    }
    const computed = getComputedStyle(element);
    const fontSize = parseFloat(computed.fontSize) || 14;
    const line = parseFloat(computed.lineHeight) || fontSize * 1.2;
    const padding = (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);
    element.style.height = 'auto';
    let height = element.scrollHeight;
    const { minRows, maxRows } = typeof autoSize === 'object' ? autoSize : { minRows: undefined, maxRows: undefined };
    if (minRows) height = Math.max(height, minRows * line + padding);
    let scroll = false;
    if (maxRows && height > maxRows * line + padding) {
      height = maxRows * line + padding;
      scroll = true;
    }
    element.style.height = `${height}px`;
    fitted = { height, scroll };
  }

  // The height follows the text, the options and the size.
  $effect(() => {
    void [text, autoSize, resolved.size, resolved.variant];
    void tick().then(fit);
  });

  // ... and the font: a web font that arrives late changes the line height and where the text wraps, while the
  // width of the field stays the same, so the observer below would not see it. Browsers without
  // `document.fonts` keep the first measurement.
  $effect(() => {
    if (!autoSize || !document.fonts) return;
    const fonts = document.fonts;
    fonts.addEventListener('loadingdone', fit);
    return () => fonts.removeEventListener('loadingdone', fit);
  });

  // ... and the width: a narrower field wraps the text into more lines. The height is set in the next frame, not
  // inside the observer's callback: changing the size of what is observed there makes the browser report
  // "ResizeObserver loop completed with undelivered notifications" as an error of the page.
  $effect(() => {
    if (!area || !autoSize || typeof ResizeObserver === 'undefined') return;
    let width = area.clientWidth;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (!area || area.clientWidth === width) return;
      width = area.clientWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(area);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  // A native form reset puts the textarea back to its default text behind the state's back (see Input).
  $effect(() => {
    const form = area?.form;
    if (!form) return;
    const restore = () => {
      setTimeout(() => {
        if (area && area.value !== text) area.value = text;
      });
    };
    form.addEventListener('reset', restore);
    return () => form.removeEventListener('reset', restore);
  });

  /** See Input: takes the text into `value`; with `settle` it is cut and the field is written back from the state. */
  function takeEdit(target: HTMLTextAreaElement, event: Event, settle: boolean): void {
    const before = text;
    let next = target.value;
    if (settle) next = clipText(counting, next);
    if (next !== before) {
      value = next;
      onchange?.(next, event);
    }
    if (settle && target.value !== text) target.value = text;
  }

  function handleInput(event: Event & { currentTarget: EventTarget & HTMLTextAreaElement }): void {
    oninput?.(event);
    takeEdit(event.currentTarget, event, !composing);
  }

  function handleCompositionStart(
    event: CompositionEvent & { currentTarget: EventTarget & HTMLTextAreaElement }
  ): void {
    composing = true;
    oncompositionstart?.(event);
  }

  function handleCompositionEnd(
    event: CompositionEvent & { currentTarget: EventTarget & HTMLTextAreaElement }
  ): void {
    composing = false;
    oncompositionend?.(event);
    takeEdit(event.currentTarget, event, true);
  }

  function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }): void {
    onkeydown?.(event);
    if (event.key === 'Enter' && !composing && !event.isComposing) onpressenter?.(event);
  }

  function clear(event: MouseEvent): void {
    value = '';
    onchange?.('', event);
    if (area && area.value !== text) area.value = text;
    area?.focus();
    onclear?.(event);
  }

  /** Moves focus to the textarea; `cursor` places the caret or selects the text. */
  export function focus(options?: InputFocusOptions): void {
    focusField(area, options);
  }

  /** Removes focus from the textarea. */
  export function blur(): void {
    area?.blur();
  }
</script>

<!--
  The root is the bordered box. It holds the textarea, the clear button (laid over its top corner) and the
  count row, so showing or hiding the clear button or the count never moves the textarea.
-->
<span class={rootClass} style={styleText(customStyle, styles?.root)}>
  <textarea
    {...rest}
    bind:this={area}
    class={classList(
      'ads-input-textarea',
      allowClear && 'ads-input-textarea-clearable',
      autoSize && 'ads-input-textarea-auto',
      classNames?.textarea
    )}
    style={areaStyle}
    value={text}
    rows={autoSize ? 1 : rows}
    {disabled}
    {readonly}
    {maxlength}
    aria-invalid={invalid ? 'true' : ariaInvalid}
    aria-describedby={describedBy}
    oninput={handleInput}
    onkeydown={handleKeydown}
    oncompositionstart={handleCompositionStart}
    oncompositionend={handleCompositionEnd}
  ></textarea>
  {#if allowClear}
    <span class="ads-input-textarea-clear">
      <ClearButton
        config={clearConfig}
        visible={clearVisible}
        class={classNames?.clear}
        style={styleText(styles?.clear)}
        onclear={clear}
      />
    </span>
  {/if}
  {#if counting.show}
    <span
      id={countId}
      class={classList('ads-input-count', overLimit && 'ads-input-count-exceeded', classNames?.count)}
      style={styleText(styles?.count)}>{countText(counting, text)}</span
    >
  {/if}
</span>

<style>
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

  .ads-input-multiline {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
  }

  .ads-input-textarea {
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: calc(var(--_fs) * var(--_lh) + 2 * max(var(--_pb), 4px));
    margin: 0;
    padding-block: max(var(--_pb), 4px);
    padding-inline: var(--_pi);
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--_fs);
    line-height: var(--_lh);
    resize: vertical;
  }

  .ads-input-textarea-auto {
    resize: none;
  }

  /* Room for the clear button laid over the top corner. */
  .ads-input-textarea-clearable {
    padding-inline-end: calc(var(--_pi) + var(--ads-input-icon-size) + var(--ads-input-gap));
  }

  .ads-input-textarea::placeholder {
    color: var(--ads-input-placeholder);
    opacity: 1;
  }

  .ads-input-disabled .ads-input-textarea {
    cursor: not-allowed;
    opacity: 1;
    -webkit-text-fill-color: currentColor;
  }

  .ads-input-textarea-clear {
    position: absolute;
    inset-block-start: calc(max(var(--_pb), 4px) + (var(--_fs) * var(--_lh) - var(--ads-input-icon-size)) / 2);
    inset-inline-end: var(--_pi);
    display: flex;
  }

  /* The count has its own row at the end of the box (it is not laid over the text). */
  .ads-input-count {
    align-self: flex-end;
    padding-block-end: 4px;
    padding-inline: var(--_pi);
    color: var(--ads-input-count-color);
    font-size: var(--_fs);
    line-height: var(--_lh);
    white-space: nowrap;
  }

  .ads-input-count-exceeded {
    color: var(--ads-color-danger-text);
  }

  .ads-input-disabled .ads-input-count {
    color: var(--ads-color-text-disabled);
  }
</style>
