<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import type { CheckboxClassNames, CheckboxStyles, CheckboxValue } from './types.js';
  import { getCheckboxGroup } from './context.js';
  import { isProduction } from '../internal/env.js';
  import { classList, styleText } from '../internal/semantic.js';

  type CheckboxProps = Omit<
    HTMLInputAttributes,
    | 'children'
    | 'class'
    | 'style'
    | 'type'
    | 'checked'
    | 'indeterminate'
    | 'value'
    | 'disabled'
    | 'name'
    | 'title'
    | 'onchange'
  > & {
    /**
     * Whether the checkbox is checked. Use `bind:checked` for two-way binding. Inside a
     * `CheckboxGroup` the state comes from the group's `value` and this prop is ignored.
     */
    checked?: boolean;
    /**
     * The "partly checked" look of a "check all" control. It changes only the appearance and the
     * state assistive technology reads (`mixed`); `checked` stays the value that is reported.
     */
    indeterminate?: boolean;
    /** Whether the checkbox is disabled. A group's `disabled` applies as well. */
    disabled?: boolean;
    /** Identity inside a `CheckboxGroup` and the native `value` of the input. */
    value?: CheckboxValue;
    /** Native `name` of the input. Inside a group the group's `name` wins. */
    name?: string;
    /** Label content; it is the accessible name of the checkbox. */
    children?: Snippet;
    /** Called once per user toggle, after the state changed, with the new value and the native `change` event. */
    onchange?: (checked: boolean, event: Event) => void;
    /** Extra classes for the `root`, `icon` and `label` parts. */
    classNames?: CheckboxClassNames;
    /** Inline styles for the `root`, `icon` and `label` parts. */
    styles?: CheckboxStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
    /** Native `title` of the root label, so the tooltip covers the box and the text. */
    title?: string;
  };

  let {
    checked = $bindable(false),
    indeterminate = false,
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
  }: CheckboxProps = $props();

  const group = getCheckboxGroup();

  // A checkbox takes part in its group only with a value: the group tells the items apart by it.
  // Without one it keeps its own state (and throws while developing, so the mistake is found early).
  const member = $derived.by(() => {
    if (!group) return false;
    if (value !== undefined) return true;
    if (!isProduction()) throw new TypeError('Checkbox inside a CheckboxGroup needs a value.');
    return false;
  });

  // Registered in the order of mounting, which is the order of the values of the group.
  if (group) onDestroy(group.register(() => value));

  let input: HTMLInputElement | undefined = $state();

  const isChecked = $derived(member ? group!.isChecked(value!) : checked);
  const isDisabled = $derived(disabled || Boolean(group?.disabled));
  const inputName = $derived(group?.name ?? name);

  const rootClass = $derived(
    classList(
      'ads-checkbox',
      isChecked && 'ads-checkbox-checked',
      indeterminate && 'ads-checkbox-indeterminate',
      isDisabled && 'ads-checkbox-disabled',
      customClass,
      classNames?.root,
      group?.classNames?.item
    )
  );
  const iconClass = $derived(classList('ads-checkbox-icon', classNames?.icon, group?.classNames?.itemIcon));
  const labelClass = $derived(
    classList('ads-checkbox-label', classNames?.label, group?.classNames?.itemLabel)
  );

  const rootStyle = $derived(styleText(group?.styles?.item, customStyle, styles?.root));
  const iconStyle = $derived(styleText(group?.styles?.itemIcon, styles?.icon));
  const labelStyle = $derived(styleText(group?.styles?.itemLabel, styles?.label));

  // A native form reset puts the input back to its default checkedness behind the state's back (it leaves
  // `indeterminate` alone). The state is the truth (the parent resets it in `onreset`), so the view is
  // restored to it once the reset has run.
  $effect(() => {
    const form = input?.form;
    if (!form) return;
    const restore = () => {
      setTimeout(() => {
        if (!input) return;
        input.checked = isChecked;
      });
    };
    form.addEventListener('reset', restore);
    return () => form.removeEventListener('reset', restore);
  });

  function handleChange(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const next = target.checked;
    if (member) {
      onchange?.(next, event);
      group!.toggle(value!, next, event);
    } else {
      checked = next;
      onchange?.(next, event);
    }
    // The input owns its state. Writing the props back reverts a change the parent refused
    // (function binding) and restores the indeterminate flag, which the browser clears on a click.
    target.checked = isChecked;
    target.indeterminate = indeterminate;
  }

  /** Moves focus to the checkbox. */
  export function focus(options?: FocusOptions): void {
    input?.focus(options);
  }

  /** Removes focus from the checkbox. */
  export function blur(): void {
    input?.blur();
  }
</script>

<!--
  A native input inside a label: the role, the checked and mixed states, Space, the Tab order, the
  click on the text and form participation come from the platform. The input is laid over the
  box, invisible, so the focus ring and the hit area are those of a real control.
-->
<label class={rootClass} style={rootStyle} {title}>
  <span class="ads-checkbox-control">
    <input
      {...rest}
      bind:this={input}
      type="checkbox"
      class="ads-checkbox-input"
      checked={isChecked}
      {indeterminate}
      disabled={isDisabled}
      name={inputName}
      value={value ?? 'on'}
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
   * The states only set the private `--_*` variables; the rules that paint the box read them, so
   * checked, indeterminate, hover and disabled combine without fighting over specificity. The
   * colors come from the `--ads-checkbox-*` tokens. Positions use logical properties, so the
   * checkbox mirrors in right-to-left layouts.
   */
  .ads-checkbox {
    --_size: var(--ads-checkbox-size);
    --_border: var(--ads-checkbox-border);
    --_bg: var(--ads-checkbox-bg);
    --_mark: var(--ads-checkbox-check-color);
    --_bar: var(--ads-checkbox-indeterminate-color);

    position: relative;
    display: inline-flex;
    align-items: flex-start;
    box-sizing: border-box;
    margin: 0;
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--ads-checkbox-font-size);
    line-height: var(--ads-checkbox-line-height);
    cursor: pointer;
  }

  .ads-checkbox-control {
    position: relative;
    flex: none;
    width: var(--_size);
    height: var(--_size);
    /* Centered in the first line of the text, so a multi-line label keeps the box at the top. */
    margin-block: calc(
      (var(--ads-checkbox-line-height) * var(--ads-checkbox-font-size) - var(--_size)) / 2
    );
  }

  .ads-checkbox-input {
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

  .ads-checkbox-icon {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border: var(--ads-checkbox-border-width) solid var(--_border);
    border-radius: var(--ads-checkbox-radius);
    background-color: var(--_bg);
    transition:
      border-color var(--ads-motion-duration-fast) var(--ads-motion-ease),
      background-color var(--ads-motion-duration-fast) var(--ads-motion-ease);
  }

  /* The check mark is a rotated corner, drawn with borders; the indeterminate bar reuses the same box. */
  .ads-checkbox-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    box-sizing: border-box;
    width: calc(var(--_size) * 0.3125);
    height: calc(var(--_size) * 0.5625);
    border: solid var(--_mark);
    border-width: 0 var(--ads-checkbox-check-width) var(--ads-checkbox-check-width) 0;
    transform: translate(-50%, -58%) rotate(45deg) scale(0);
    opacity: 0;
    transition:
      opacity var(--ads-motion-duration-fast) var(--ads-motion-ease),
      transform var(--ads-motion-duration-slow) var(--ads-motion-ease-out-back);
  }

  .ads-checkbox-checked .ads-checkbox-icon {
    --_border: var(--ads-checkbox-checked-bg);
    --_bg: var(--ads-checkbox-checked-bg);
  }

  .ads-checkbox-checked .ads-checkbox-icon::after {
    transform: translate(-50%, -58%) rotate(45deg) scale(1);
    opacity: 1;
  }

  /* The bar replaces the check mark whatever the checked state. */
  .ads-checkbox-indeterminate .ads-checkbox-icon {
    --_border: var(--ads-checkbox-border);
    --_bg: var(--ads-checkbox-bg);
  }

  .ads-checkbox-indeterminate .ads-checkbox-icon::after {
    width: calc(var(--_size) / 2);
    height: calc(var(--_size) / 2);
    border: 0;
    background-color: var(--_bar);
    transform: translate(-50%, -50%);
    opacity: 1;
  }

  /* Hover anywhere over the label, box or text. */
  .ads-checkbox:not(.ads-checkbox-disabled):hover .ads-checkbox-icon {
    --_border: var(--ads-checkbox-border-hover);
  }

  .ads-checkbox-checked:not(.ads-checkbox-disabled, .ads-checkbox-indeterminate):hover
    .ads-checkbox-icon {
    --_border: var(--ads-checkbox-checked-bg-hover);
    --_bg: var(--ads-checkbox-checked-bg-hover);
  }

  .ads-checkbox-input:focus-visible + .ads-checkbox-icon {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  .ads-checkbox-label {
    padding-inline: var(--ads-checkbox-label-padding);
  }

  /* Last, so the disabled colors win over the checked and indeterminate ones. */
  .ads-checkbox-disabled {
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  .ads-checkbox-disabled .ads-checkbox-icon {
    --_border: var(--ads-checkbox-disabled-border);
    --_bg: var(--ads-checkbox-disabled-bg);
    --_mark: var(--ads-checkbox-disabled-check-color);
    --_bar: var(--ads-checkbox-disabled-check-color);
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-checkbox-icon,
    .ads-checkbox-icon::after {
      transition: none;
    }
  }
</style>
