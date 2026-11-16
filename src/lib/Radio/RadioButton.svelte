<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import type { RadioButtonClassNames, RadioButtonStyles, RadioValue } from './types.js';
  import { getRadioGroup } from './context.js';
  import { isNone } from './options.js';
  import { isProduction } from '../internal/env.js';
  import { classList, styleText } from '../internal/semantic.js';

  type RadioButtonProps = Omit<
    HTMLInputAttributes,
    | 'children'
    | 'class'
    | 'style'
    | 'type'
    | 'checked'
    | 'value'
    | 'disabled'
    | 'name'
    | 'title'
    | 'onchange'
  > & {
    /**
     * Whether the button is selected. Use `bind:checked` for two-way binding. Inside a `RadioGroup`
     * the state comes from the group's `value` and this prop is ignored.
     */
    checked?: boolean;
    /** Whether the button is disabled. A group's `disabled` applies as well. */
    disabled?: boolean;
    /** Identity inside a `RadioGroup` and the native `value` of the input (written as text). */
    value?: RadioValue;
    /** Native `name` of the input. Inside a group the group's name wins. */
    name?: string;
    /** Label content; it is the accessible name of the button. */
    children?: Snippet;
    /**
     * Called once when the user selects the button, after the state changed, with `true` and the native
     * `change` event. A radio cannot be unchecked by the user, so the first argument is always `true`.
     */
    onchange?: (checked: boolean, event: Event) => void;
    /** Extra classes for the `root` and `label` parts. */
    classNames?: RadioButtonClassNames;
    /** Inline styles for the `root` and `label` parts. */
    styles?: RadioButtonStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
    /** Native `title` of the root label. */
    title?: string;
  };

  let {
    checked = $bindable(false),
    disabled = false,
    value = undefined,
    name = undefined,
    children,
    onchange,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    title = undefined,
    ...rest
  }: RadioButtonProps = $props();

  const group = getRadioGroup();

  // As for `Radio`: a button takes part in its group only with a value.
  const member = $derived.by(() => {
    if (!group) return false;
    if (!isNone(value)) return true;
    if (!isProduction()) throw new TypeError('RadioButton inside a RadioGroup needs a value.');
    return false;
  });

  let input: HTMLInputElement | undefined = $state();

  const isChecked = $derived(member ? group!.isChecked(value as RadioValue) : checked);
  const isDisabled = $derived(disabled || Boolean(group?.disabled));
  const inputName = $derived(member ? group!.name : name);
  const inputForm = $derived(member ? group!.form : undefined);
  const size = $derived(member ? group!.size : 'medium');
  const solid = $derived(member && group!.buttonStyle === 'solid');

  /** Writes the state to the input: the view is always the state. */
  function sync(): void {
    if (input) input.checked = isChecked;
  }

  if (group) onDestroy(group.register(sync));

  const rootClass = $derived(
    classList(
      'ads-radio-button',
      solid && 'ads-radio-button-solid',
      size !== 'medium' && `ads-radio-button-${size}`,
      isChecked && 'ads-radio-button-checked',
      isDisabled && 'ads-radio-button-disabled',
      member && 'ads-radio-button-grouped',
      member && group!.orientation === 'vertical' && 'ads-radio-button-vertical',
      member && group!.block && 'ads-radio-button-block',
      customClass,
      classNames?.root,
      group?.classNames?.item
    )
  );
  const labelClass = $derived(
    classList('ads-radio-button-label', classNames?.label, group?.classNames?.itemLabel)
  );

  const rootStyle = $derived(styleText(group?.styles?.item, customStyle, styles?.root));
  const labelStyle = $derived(styleText(group?.styles?.itemLabel, styles?.label));

  // A native form reset puts the input back to its default checkedness behind the state's back; the
  // state is the truth, so the view is restored to it once the reset has run.
  $effect(() => {
    const form = input?.form;
    if (!form) return;
    const restore = () => {
      setTimeout(sync);
    };
    form.addEventListener('reset', restore);
    return () => form.removeEventListener('reset', restore);
  });

  // A radio sends `change` only when it became checked.
  function handleChange(event: Event): void {
    if (member) {
      onchange?.(true, event);
      group!.select(value as RadioValue, event);
    } else {
      checked = true;
      onchange?.(true, event);
      sync();
    }
  }

  /** Moves focus to the button. */
  export function focus(options?: FocusOptions): void {
    input?.focus(options);
  }

  /** Removes focus from the button. */
  export function blur(): void {
    input?.blur();
  }
</script>

<!--
  A radio drawn as a button: the same native input in a label, so the role, Space, the arrow keys, the Tab
  order and forms come from the platform. The input covers the whole button, invisible except for its focus
  ring, which it draws itself (no `:has()`, so the ring needs no newer engine).
-->
<label class={rootClass} style={rootStyle} {title}>
  <input
    {...rest}
    bind:this={input}
    type="radio"
    class="ads-radio-button-input"
    checked={isChecked}
    disabled={isDisabled}
    name={inputName}
    form={inputForm ?? rest.form}
    value={isNone(value) ? 'on' : String(value)}
    onchange={handleChange}
  />
  {#if children}
    <span class={labelClass} style={labelStyle}>{@render children()}</span>
  {/if}
</label>

<style>
  /*
   * The states only set the private `--_*` variables; the rules that paint the button read them. A
   * button keeps the same 1px border in every state and only changes colors, so nothing moves when
   * it is selected. Positions and corners use logical properties, so a group mirrors in right-to-left layouts.
   */
  .ads-radio-button {
    --_height: var(--ads-control-height);
    --_radius: var(--ads-radius-md);
    --_pad: var(--ads-radio-button-padding-inline);
    --_font: var(--ads-font-size);
    --_bg: var(--ads-radio-button-bg);
    --_border: var(--ads-radio-button-border);
    --_color: var(--ads-radio-button-color);

    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-height: var(--_height);
    margin: 0;
    padding-block: 0;
    padding-inline: var(--_pad);
    border: var(--ads-border-width) solid var(--_border);
    border-radius: var(--_radius);
    background-color: var(--_bg);
    color: var(--_color);
    font-family: var(--ads-font-family);
    font-size: var(--_font);
    line-height: var(--ads-radio-line-height);
    text-align: center;
    cursor: pointer;
    transition:
      color var(--ads-motion-duration) ease,
      background-color var(--ads-motion-duration) ease,
      border-color var(--ads-motion-duration) ease;
  }

  .ads-radio-button-large {
    --_height: var(--ads-control-height-lg);
    --_radius: var(--ads-radius-lg);
    --_font: var(--ads-font-size-lg);
  }

  .ads-radio-button-small {
    --_height: var(--ads-control-height-sm);
    --_radius: var(--ads-radius-sm);
    --_pad: var(--ads-radio-button-padding-inline-sm);
    --_font: var(--ads-font-size-sm);
  }

  /*
   * The input covers the border box and draws nothing but its focus ring: no native look, no background,
   * and the corners of the button, so the ring follows them in the engines that round outlines.
   */
  .ads-radio-button-input {
    position: absolute;
    inset: calc(-1 * var(--ads-border-width));
    z-index: 1;
    box-sizing: border-box;
    width: calc(100% + 2 * var(--ads-border-width));
    height: calc(100% + 2 * var(--ads-border-width));
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: inherit;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    cursor: inherit;
  }

  .ads-radio-button-input:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  /* The checked button is raised, so its border is whole where it meets a neighbour's. */
  .ads-radio-button-checked {
    --_bg: var(--ads-radio-button-checked-bg);
    --_border: var(--ads-color-primary-text);
    --_color: var(--ads-color-primary-text);
    z-index: 1;
  }

  .ads-radio-button:not(.ads-radio-button-disabled):hover {
    --_color: var(--ads-color-primary-text);
  }

  .ads-radio-button-checked:not(.ads-radio-button-disabled):hover {
    --_border: var(--ads-color-primary-text-hover);
    --_color: var(--ads-color-primary-text-hover);
  }

  .ads-radio-button-checked:not(.ads-radio-button-disabled):active {
    --_border: var(--ads-color-primary-text-active);
    --_color: var(--ads-color-primary-text-active);
  }

  .ads-radio-button-solid.ads-radio-button-checked {
    --_bg: var(--ads-color-primary-solid);
    --_border: var(--ads-color-primary-solid);
    --_color: var(--ads-color-text-inverse);
  }

  .ads-radio-button-solid.ads-radio-button-checked:not(.ads-radio-button-disabled):hover {
    --_bg: var(--ads-color-primary-solid-hover);
    --_border: var(--ads-color-primary-solid-hover);
    --_color: var(--ads-color-text-inverse);
  }

  .ads-radio-button-solid.ads-radio-button-checked:not(.ads-radio-button-disabled):active {
    --_bg: var(--ads-color-primary-solid-active);
    --_border: var(--ads-color-primary-solid-active);
    --_color: var(--ads-color-text-inverse);
  }

  /* In a group the buttons touch and share a border; only the outer corners are round. */
  .ads-radio-button-grouped {
    border-radius: 0;
  }

  .ads-radio-button-grouped:not(:first-child) {
    margin-inline-start: calc(-1 * var(--ads-border-width));
  }

  .ads-radio-button-grouped:not(.ads-radio-button-vertical):first-child {
    border-start-start-radius: var(--_radius);
    border-end-start-radius: var(--_radius);
  }

  .ads-radio-button-grouped:not(.ads-radio-button-vertical):last-child {
    border-start-end-radius: var(--_radius);
    border-end-end-radius: var(--_radius);
  }

  .ads-radio-button-vertical:not(:first-child) {
    margin-inline-start: 0;
    margin-block-start: calc(-1 * var(--ads-border-width));
  }

  .ads-radio-button-vertical:first-child {
    border-start-start-radius: var(--_radius);
    border-start-end-radius: var(--_radius);
  }

  .ads-radio-button-vertical:last-child {
    border-end-start-radius: var(--_radius);
    border-end-end-radius: var(--_radius);
  }

  /* `block`: the buttons share the width of the group equally. */
  .ads-radio-button-block:not(.ads-radio-button-vertical) {
    flex: 1 1 0%;
  }

  /* Last, so the disabled colors win over the checked and solid ones. */
  .ads-radio-button-disabled {
    --_bg: var(--ads-radio-button-disabled-bg);
    --_border: var(--ads-radio-button-disabled-border);
    --_color: var(--ads-radio-button-disabled-color);
    cursor: not-allowed;
  }

  .ads-radio-button-disabled.ads-radio-button-checked {
    --_bg: var(--ads-radio-button-checked-disabled-bg);
    --_color: var(--ads-radio-button-checked-disabled-color);
  }

  .ads-radio-button-disabled.ads-radio-button-solid.ads-radio-button-checked {
    --_border: var(--ads-radio-button-disabled-border);
  }

  /*
   * Forced colors (Windows High Contrast): the system replaces the author's backgrounds and the colors of
   * the checked state would all become the same. A checked button is drawn in the system's selection colors,
   * the others in the colors of a button, a disabled one in GrayText.
   */
  @media (forced-colors: active) {
    .ads-radio-button {
      border-color: ButtonText;
      color: ButtonText;
    }

    .ads-radio-button-checked {
      border-color: Highlight;
      background-color: Highlight;
      color: HighlightText;
    }

    .ads-radio-button-disabled {
      border-color: GrayText;
      color: GrayText;
    }

    .ads-radio-button-disabled.ads-radio-button-checked {
      border-color: GrayText;
      background-color: GrayText;
      color: Canvas;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-radio-button {
      transition: none;
    }
  }
</style>
