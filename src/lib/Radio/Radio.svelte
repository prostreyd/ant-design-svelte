<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import type { RadioClassNames, RadioStyles, RadioValue } from './types.js';
  import { getRadioGroup } from './context.js';
  import { isNone } from './options.js';
  import { isProduction } from '../internal/env.js';
  import { classList, styleText } from '../internal/semantic.js';

  type RadioProps = Omit<
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
     * Whether the radio is selected. Use `bind:checked` for two-way binding. Inside a `RadioGroup`
     * the state comes from the group's `value` and this prop is ignored.
     */
    checked?: boolean;
    /** Whether the radio is disabled. A group's `disabled` applies as well. */
    disabled?: boolean;
    /** Identity inside a `RadioGroup` and the native `value` of the input (written as text). */
    value?: RadioValue;
    /** Native `name` of the input. Inside a group the group's name wins. */
    name?: string;
    /** Label content; it is the accessible name of the radio. */
    children?: Snippet;
    /**
     * Called once when the user selects the radio, after the state changed, with `true` and the native
     * `change` event. A radio cannot be unchecked by the user, so the first argument is always `true`.
     */
    onchange?: (checked: boolean, event: Event) => void;
    /** Extra classes for the `root`, `icon` and `label` parts. */
    classNames?: RadioClassNames;
    /** Inline styles for the `root`, `icon` and `label` parts. */
    styles?: RadioStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
    /** Native `title` of the root label, so the tooltip covers the mark and the text. */
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
  }: RadioProps = $props();

  const group = getRadioGroup();

  // A radio takes part in its group only with a value: the group tells the items apart by it.
  // Without one it keeps its own state (and throws while developing, so the mistake is found early).
  const member = $derived.by(() => {
    if (!group) return false;
    if (!isNone(value)) return true;
    if (!isProduction()) throw new TypeError('Radio inside a RadioGroup needs a value.');
    return false;
  });

  let input: HTMLInputElement | undefined = $state();

  const isChecked = $derived(member ? group!.isChecked(value as RadioValue) : checked);
  const isDisabled = $derived(disabled || Boolean(group?.disabled));
  const inputName = $derived(member ? group!.name : name);
  const inputForm = $derived(member ? group!.form : undefined);

  /** Writes the state to the input: the view is always the state. */
  function sync(): void {
    if (input) input.checked = isChecked;
  }

  // The group calls this after every selection (see the context).
  if (group) onDestroy(group.register(sync));

  const rootClass = $derived(
    classList(
      'ads-radio',
      isChecked && 'ads-radio-checked',
      isDisabled && 'ads-radio-disabled',
      member && 'ads-radio-grouped',
      member && group!.orientation === 'vertical' && 'ads-radio-vertical',
      member && group!.block && 'ads-radio-block',
      customClass,
      classNames?.root,
      group?.classNames?.item
    )
  );
  const iconClass = $derived(classList('ads-radio-icon', classNames?.icon, group?.classNames?.itemIcon));
  const labelClass = $derived(classList('ads-radio-label', classNames?.label, group?.classNames?.itemLabel));

  const rootStyle = $derived(styleText(group?.styles?.item, customStyle, styles?.root));
  const iconStyle = $derived(styleText(group?.styles?.itemIcon, styles?.icon));
  const labelStyle = $derived(styleText(group?.styles?.itemLabel, styles?.label));

  // A native form reset puts the input back to its default checkedness behind the state's back. The
  // state is the truth (the parent resets it in `onreset`), so the view is restored to it once the
  // reset has run.
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
      // The input owns its state. Writing the prop back reverts a selection the parent refused
      // (function binding).
      sync();
    }
  }

  /** Moves focus to the radio. */
  export function focus(options?: FocusOptions): void {
    input?.focus(options);
  }

  /** Removes focus from the radio. */
  export function blur(): void {
    input?.blur();
  }
</script>

<!--
  A native input inside a label: the role, the checked state, Space, the arrow keys, the Tab order, the
  click on the text and form participation come from the platform. The input is laid over the mark,
  invisible, so the focus ring and the hit area are those of a real control.
-->
<label class={rootClass} style={rootStyle} {title}>
  <span class="ads-radio-control">
    <input
      {...rest}
      bind:this={input}
      type="radio"
      class="ads-radio-input"
      checked={isChecked}
      disabled={isDisabled}
      name={inputName}
      form={inputForm ?? rest.form}
      value={isNone(value) ? 'on' : String(value)}
      onchange={handleChange}
    />
    <span class={iconClass} style={iconStyle} aria-hidden="true"></span>
  </span>
  {#if children}
    <span class={labelClass} style={labelStyle}>{@render children()}</span>
  {/if}
</label>

<style>
  /*
   * The states only set the private `--_*` variables; the rules that paint the mark read them, so
   * checked, hover and disabled combine without fighting over specificity. The colors come from the
   * `--ads-radio-*` tokens. Positions use logical properties, so the radio mirrors in right-to-left layouts.
   */
  .ads-radio {
    --_size: var(--ads-radio-size);
    --_border: var(--ads-radio-border);
    --_bg: var(--ads-radio-bg);
    --_dot: var(--ads-radio-dot-color);

    position: relative;
    display: inline-flex;
    align-items: flex-start;
    box-sizing: border-box;
    margin: 0;
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--ads-radio-font-size);
    line-height: var(--ads-radio-line-height);
    cursor: pointer;
  }

  .ads-radio-control {
    position: relative;
    flex: none;
    width: var(--_size);
    height: var(--_size);
    /* Centered in the first line of the text, so a multi-line label keeps the mark at the top. */
    margin-block: calc((var(--ads-radio-line-height) * var(--ads-radio-font-size) - var(--_size)) / 2);
  }

  .ads-radio-input {
    position: absolute;
    inset: 0;
    z-index: 1;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    opacity: 0;
    cursor: inherit;
  }

  .ads-radio-icon {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border: var(--ads-radio-border-width) solid var(--_border);
    border-radius: 50%;
    background-color: var(--_bg);
    transition:
      border-color var(--ads-motion-duration) ease,
      background-color var(--ads-motion-duration) ease;
  }

  /* The dot is drawn inside the mark and only scaled, so selecting never changes the size of anything. */
  .ads-radio-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    box-sizing: border-box;
    width: var(--ads-radio-dot-size);
    height: var(--ads-radio-dot-size);
    border-radius: 50%;
    background-color: var(--_dot);
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    transition:
      opacity var(--ads-motion-duration) ease,
      transform var(--ads-motion-duration-slow) var(--ads-motion-ease-in-out-circ);
  }

  .ads-radio-checked .ads-radio-icon {
    --_border: var(--ads-radio-checked-bg);
    --_bg: var(--ads-radio-checked-bg);
  }

  .ads-radio-checked .ads-radio-icon::after {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  /* Hover anywhere over the label, mark or text. */
  .ads-radio:not(.ads-radio-disabled):hover .ads-radio-icon {
    --_border: var(--ads-radio-border-hover);
  }

  .ads-radio-checked:not(.ads-radio-disabled):hover .ads-radio-icon {
    --_border: var(--ads-radio-checked-bg-hover);
    --_bg: var(--ads-radio-checked-bg-hover);
  }

  .ads-radio-input:focus-visible + .ads-radio-icon {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  .ads-radio-label {
    padding-inline: var(--ads-radio-label-padding);
  }

  /* In a group: the gap after every item but the last, in the direction of the group. */
  .ads-radio-grouped:not(:last-child) {
    margin-inline-end: var(--ads-radio-group-gap);
  }

  .ads-radio-vertical:not(:last-child) {
    margin-inline-end: 0;
    margin-block-end: var(--ads-radio-group-gap);
  }

  /* `block`: the items share the width of the group equally, the content centered in each. */
  .ads-radio-block:not(.ads-radio-vertical) {
    flex: 1 1 0%;
    justify-content: center;
  }

  /* Last, so the disabled colors win over the checked ones. */
  .ads-radio-disabled {
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  .ads-radio-disabled .ads-radio-icon {
    --_border: var(--ads-radio-disabled-border);
    --_bg: var(--ads-radio-disabled-bg);
    --_dot: var(--ads-radio-disabled-dot-color);
  }

  /*
   * Forced colors (Windows High Contrast): the system replaces the author's backgrounds, and the dot is a
   * background, so it would vanish and a checked radio would look unchecked. The ring and the dot take system
   * colors: unchecked and checked differ by the dot (and the ring color), disabled uses GrayText.
   */
  @media (forced-colors: active) {
    .ads-radio-icon {
      border-color: ButtonText;
    }

    .ads-radio-checked .ads-radio-icon {
      border-color: Highlight;
    }

    .ads-radio-icon::after {
      background-color: Highlight;
    }

    .ads-radio-disabled {
      color: GrayText;
    }

    .ads-radio-disabled .ads-radio-icon,
    .ads-radio-disabled.ads-radio-checked .ads-radio-icon {
      border-color: GrayText;
    }

    .ads-radio-disabled .ads-radio-icon::after {
      background-color: GrayText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-radio-icon,
    .ads-radio-icon::after {
      transition: none;
    }
  }
</style>
