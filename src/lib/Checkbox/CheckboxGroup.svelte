<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type {
    CheckboxGroupClassNames,
    CheckboxGroupStyles,
    CheckboxOption,
    CheckboxValue
  } from './types.js';
  import Checkbox from './Checkbox.svelte';
  import { setCheckboxGroup } from './context.js';
  import { classList, styleText } from '../internal/semantic.js';

  type CheckboxGroupProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'class' | 'style' | 'role' | 'onchange'
  > & {
    /** The selected values. Use `bind:value` for two-way binding. */
    value?: CheckboxValue[];
    /** Renders one checkbox per entry. A string or a number is both the value and the label. */
    options?: ReadonlyArray<CheckboxValue | CheckboxOption>;
    /** Custom markup with `Checkbox` elements inside; ignored when `options` has entries. */
    children?: Snippet;
    /** Disables every checkbox of the group. */
    disabled?: boolean;
    /** Native `name` of every input of the group. */
    name?: string;
    /** Called once per user toggle with the new array and the `change` event of the toggled input. */
    onchange?: (value: CheckboxValue[], event: Event) => void;
    /** Extra classes for the `root`, `item`, `itemIcon` and `itemLabel` parts. */
    classNames?: CheckboxGroupClassNames;
    /** Inline styles for the `root`, `item`, `itemIcon` and `itemLabel` parts. */
    styles?: CheckboxGroupStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
  };

  let {
    value = $bindable([]),
    options = [],
    children,
    disabled = false,
    name = undefined,
    onchange,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    ...rest
  }: CheckboxGroupProps = $props();

  const normalized = $derived<CheckboxOption[]>(
    options.map((option) =>
      typeof option === 'object' ? option : { label: String(option), value: option }
    )
  );
  const hasOptions = $derived(normalized.length > 0);

  // The checkboxes inside, in the order of mounting; with `options` their order is the options' order.
  let registered: Array<() => CheckboxValue | undefined> = [];

  /** The place of a value among the options or the mounted checkboxes; -1 for an unknown value. */
  function orderOf(item: CheckboxValue): number {
    if (hasOptions) return normalized.findIndex((option) => option.value === item);
    return registered.findIndex((read) => read() === item);
  }

  /** Known values in their order, then the unknown ones in the order they had. */
  function sorted(values: CheckboxValue[]): CheckboxValue[] {
    const known = values.filter((item) => orderOf(item) >= 0).sort((a, b) => orderOf(a) - orderOf(b));
    const unknown = values.filter((item) => orderOf(item) < 0);
    return [...known, ...unknown];
  }

  function toggle(item: CheckboxValue, checked: boolean, event: Event): void {
    const current = value;
    const next = checked
      ? current.includes(item)
        ? current
        : [...current, item]
      : current.filter((other) => other !== item);
    const ordered = sorted(next);
    value = ordered;
    onchange?.(ordered, event);
  }

  setCheckboxGroup({
    isChecked: (item) => value.includes(item),
    get disabled() {
      return disabled;
    },
    get name() {
      return name;
    },
    get classNames() {
      return classNames;
    },
    get styles() {
      return styles;
    },
    toggle,
    register(read) {
      registered = [...registered, read];
      return () => {
        registered = registered.filter((other) => other !== read);
      };
    }
  });

  const rootClass = $derived(classList('ads-checkbox-group', customClass, classNames?.root));
  const rootStyle = $derived(styleText(customStyle, styles?.root));
</script>

<div {...rest} role="group" class={rootClass} style={rootStyle}>
  {#if hasOptions}
    {#each normalized as option (option.value)}
      <Checkbox
        value={option.value}
        disabled={option.disabled}
        title={option.title}
        class={option.class}
        style={option.style}
        onchange={option.onchange}
      >
        {#if typeof option.label === 'string'}{option.label}{:else}{@render option.label()}{/if}
      </Checkbox>
    {/each}
  {:else}
    {@render children?.()}
  {/if}
</div>

<style>
  .ads-checkbox-group {
    display: inline-flex;
    flex-wrap: wrap;
    column-gap: var(--ads-checkbox-group-gap);
    box-sizing: border-box;
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--ads-checkbox-font-size);
    line-height: var(--ads-checkbox-line-height);
  }
</style>
