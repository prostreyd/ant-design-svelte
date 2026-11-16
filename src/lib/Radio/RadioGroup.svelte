<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type {
    RadioButtonStyle,
    RadioGroupClassNames,
    RadioGroupStyles,
    RadioOption,
    RadioOptionType,
    RadioOrientation,
    RadioSize,
    RadioValue
  } from './types.js';
  import Radio from './Radio.svelte';
  import RadioButton from './RadioButton.svelte';
  import { setRadioGroup } from './context.js';
  import {
    RADIO_BUTTON_STYLES,
    RADIO_OPTION_TYPES,
    RADIO_ORIENTATIONS,
    RADIO_SIZES,
    isNone,
    normalizeSize
  } from './options.js';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';

  type RadioGroupProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'class' | 'style' | 'role' | 'onchange'
  > & {
    /**
     * The selected value; `undefined` and `null` mean nothing is selected. Use `bind:value` for
     * two-way binding.
     */
    value?: RadioValue | null;
    /** Renders one radio per entry. A string, a number or a boolean is both the value and the label. */
    options?: ReadonlyArray<RadioValue | RadioOption>;
    /** What `options` render: plain radios (`default`) or buttons (`button`). */
    optionType?: RadioOptionType;
    /** Custom markup with `Radio` and `RadioButton` elements inside; ignored when `options` has entries. */
    children?: Snippet;
    /** How a checked button is drawn, for every `RadioButton` inside. */
    buttonStyle?: RadioButtonStyle;
    /** The size of the buttons; plain radios ignore it. `middle` and `default` are aliases of `medium`. */
    size?: RadioSize;
    /** The direction of the items. When it is set it wins over `vertical`. */
    orientation?: RadioOrientation;
    /** A shorthand for `orientation="vertical"`. */
    vertical?: boolean;
    /** The group fills the width of its parent and its items share it equally. */
    block?: boolean;
    /** Disables every radio of the group. */
    disabled?: boolean;
    /** Native `name` of every input of the group. Without one the group makes a unique name of its own. */
    name?: string;
    /** Called once per user selection with the new value and the `change` event of the selected input. */
    onchange?: (value: RadioValue, event: Event) => void;
    /** Extra classes for the `root`, `item`, `itemIcon` and `itemLabel` parts. */
    classNames?: RadioGroupClassNames;
    /** Inline styles for the `root`, `item`, `itemIcon` and `itemLabel` parts. */
    styles?: RadioGroupStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
  };

  let {
    value = $bindable(undefined),
    options = [],
    optionType = 'default',
    children,
    buttonStyle = 'outline',
    size = 'medium',
    orientation = undefined,
    vertical = false,
    block = false,
    disabled = false,
    name = undefined,
    onchange,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    ...rest
  }: RadioGroupProps = $props();

  // Stable between the server and the client, unique per group.
  const uid = $props.id();

  const resolved = $derived({
    optionType: resolveOption('RadioGroup', 'optionType', optionType, RADIO_OPTION_TYPES, 'default'),
    buttonStyle: resolveOption('RadioGroup', 'buttonStyle', buttonStyle, RADIO_BUTTON_STYLES, 'outline'),
    size: normalizeSize(resolveOption('RadioGroup', 'size', size, RADIO_SIZES, 'medium')),
    // `orientation` wins over `vertical` when both are given, as in React.
    orientation:
      orientation === undefined
        ? vertical
          ? ('vertical' as const)
          : ('horizontal' as const)
        : resolveOption('RadioGroup', 'orientation', orientation, RADIO_ORIENTATIONS, 'horizontal')
  });

  // A group without a name of its own gets a unique one, so the browser treats its inputs as one native
  // radio group (one Tab stop, arrow keys that stay inside). It has no form owner then, so a surrounding
  // `<form>` does not submit that made-up name.
  const generatedName = `ads-radio-group-${uid}`;
  const inputName = $derived(name ? name : generatedName);
  const detachedForm = $derived(name ? undefined : `${generatedName}-no-form`);

  const normalized = $derived<RadioOption[]>(
    options.map((option) =>
      typeof option === 'object' ? option : { label: String(option), value: option }
    )
  );
  const hasOptions = $derived(normalized.length > 0);

  // The functions that write the state of each radio inside back to its input.
  let syncs: Array<() => void> = [];

  function select(item: RadioValue, event: Event): void {
    value = item;
    onchange?.(item, event);
    // The browser unchecked the previous radio on its own; if the parent refused the change (function
    // binding) or chose another value, the view has to be put back to the state, for every radio.
    for (const sync of syncs) sync();
  }

  setRadioGroup({
    isChecked: (item) => !isNone(value) && value === item,
    get disabled() {
      return disabled;
    },
    get name() {
      return inputName;
    },
    get form() {
      return detachedForm;
    },
    get buttonStyle() {
      return resolved.buttonStyle;
    },
    get size() {
      return resolved.size;
    },
    get orientation() {
      return resolved.orientation;
    },
    get block() {
      return block;
    },
    get classNames() {
      return classNames;
    },
    get styles() {
      return styles;
    },
    select,
    register(sync) {
      syncs = [...syncs, sync];
      return () => {
        syncs = syncs.filter((other) => other !== sync);
      };
    }
  });

  const rootClass = $derived(
    classList(
      'ads-radio-group',
      `ads-radio-group-${resolved.buttonStyle}`,
      resolved.orientation === 'vertical' && 'ads-radio-group-vertical',
      block && 'ads-radio-group-block',
      customClass,
      classNames?.root
    )
  );
  const rootStyle = $derived(styleText(customStyle, styles?.root));
</script>

<div {...rest} role="radiogroup" class={rootClass} style={rootStyle}>
  {#if hasOptions}
    {#each normalized as option (option.value)}
      {#if resolved.optionType === 'button'}
        <RadioButton
          value={option.value}
          disabled={option.disabled}
          title={option.title}
          id={option.id}
          required={option.required}
          class={option.class}
          style={option.style}
          onchange={option.onchange}
        >
          {#if typeof option.label === 'string'}{option.label}{:else}{@render option.label()}{/if}
        </RadioButton>
      {:else}
        <Radio
          value={option.value}
          disabled={option.disabled}
          title={option.title}
          id={option.id}
          required={option.required}
          class={option.class}
          style={option.style}
          onchange={option.onchange}
        >
          {#if typeof option.label === 'string'}{option.label}{:else}{@render option.label()}{/if}
        </Radio>
      {/if}
    {/each}
  {:else}
    {@render children?.()}
  {/if}
</div>

<style>
  .ads-radio-group {
    display: inline-flex;
    flex-wrap: wrap;
    box-sizing: border-box;
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--ads-radio-font-size);
    line-height: var(--ads-radio-line-height);
  }

  .ads-radio-group-vertical {
    flex-direction: column;
    flex-wrap: nowrap;
  }

  /* `block`: as wide as the parent; the items share the width (they carry their own `flex`). */
  .ads-radio-group-block {
    display: flex;
    width: 100%;
  }
</style>
