<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
  import type {
    InputFocusOptions,
    InputOTPClassNames,
    InputOTPStyles,
    InputSize,
    InputStatus,
    InputVariant
  } from './types.js';
  import { isProduction } from '../internal/env.js';
  import { classList, styleText } from '../internal/semantic.js';
  import { normalizeSize } from './field.js';
  import Input from './Input.svelte';

  type InputOTPProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style' | 'onchange' | 'oninput'> & {
    /** The characters entered so far, without gaps. Use `bind:value` for two-way binding; a plain value is the initial text. */
    value?: string;
    /** Number of cells. */
    length?: number;
    /** Hides the characters: `true` shows a bullet, a string is the single character shown instead. */
    mask?: boolean | string;
    /** Maps the whole text to the displayed text; the cell at index `i` shows the `i`-th character of the result. */
    formatter?: (value: string) => string;
    /** Rendered after the cell at the given index: plain text, or a snippet that receives the index. */
    separator?: string | Snippet<[index: number]>;
    /** Whether every cell is disabled. */
    disabled?: boolean;
    /** Size of the cells. `middle` and `default` are compatibility aliases of `medium`. */
    size?: InputSize;
    /** Visual variant of the cells. */
    variant?: InputVariant;
    /** Validation look of the cells. */
    status?: InputStatus;
    /** Native `autocomplete` of every cell; `one-time-code` enables autofill of a code. */
    autocomplete?: HTMLInputAttributes['autocomplete'];
    /** Called when every cell is filled, with the whole text. */
    onchange?: (value: string) => void;
    /** Called on each change, with one entry per cell (`''` for an empty one). */
    oninput?: (values: string[]) => void;
    /** Extra classes for the `root`, the cells (`input`) and the `separator`. */
    classNames?: InputOTPClassNames;
    /** Inline styles for the `root`, the cells (`input`) and the `separator`. */
    styles?: InputOTPStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
  };

  let {
    value = $bindable(''),
    length = 6,
    mask = false,
    formatter,
    separator = undefined,
    disabled = false,
    size = 'medium',
    variant = 'outlined',
    status = undefined,
    autocomplete = undefined,
    onchange,
    oninput,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    ...rest
  }: InputOTPProps = $props();

  let cells: Array<ReturnType<typeof Input> | undefined> = $state([]);
  // Whether an IME composition is open in a cell: its text is taken when the composition ends.
  let composing = false;

  // A bad length is a mistake while developing; a production build falls back to the default.
  const count = $derived.by(() => {
    if (Number.isInteger(length) && length >= 1) return length;
    if (!isProduction()) throw new RangeError('InputOTP length must be a positive integer.');
    return 6;
  });

  // The mask character: `true` is a bullet, a string is its first character.
  const maskChar = $derived.by(() => {
    if (mask === true) return '•';
    if (typeof mask !== 'string' || mask === '') return undefined;
    if ([...mask].length > 1 && !isProduction()) {
      throw new RangeError('InputOTP mask must be a single character.');
    }
    return [...mask][0];
  });

  // The text as code points: one per cell, no gaps, never more than there are cells.
  const chars = $derived([...(value ?? '')].slice(0, count));
  const shown = $derived([...(formatter ? formatter(chars.join('')) : chars.join(''))]);

  // A cell is as wide as the field is high, and has no inline padding (the character is centered).
  const cellStyle = $derived(
    `flex: none; width: var(${
      { large: '--ads-control-height-lg', medium: '--ads-control-height', small: '--ads-control-height-sm' }[normalizeSize(size)]
    }); --_pi: 0px;`
  );

  /** The accessible name of a cell (English; a locale mechanism is planned). */
  const cellLabel = (index: number): string => `Character ${index + 1} of ${count}`;

  function display(index: number): string {
    if (maskChar !== undefined) return index < chars.length ? maskChar : '';
    return shown[index] ?? '';
  }

  /** Puts `incoming` into the cells from `index`, replacing what is there; an empty text removes the character at `index`. */
  function apply(index: number, incoming: string): void {
    const next = [...chars];
    const added = [...incoming];
    const at = Math.min(index, next.length);
    if (added.length === 0) next.splice(at, 1);
    else next.splice(at, added.length, ...added);
    const text = next.slice(0, count).join('');
    const changed = text !== chars.join('');
    value = text;
    if (changed) {
      oninput?.(Array.from({ length: count }, (_, i) => [...text][i] ?? ''));
      if ([...text].length === count) onchange?.(text);
    }
    const target = Math.min(at + Math.max(added.length, 0), count - 1);
    focusCell(added.length === 0 ? at : target);
  }

  // After the render, so a cell whose character just changed is selected with its new text.
  function focusCell(index: number): void {
    void tick().then(() => cells[Math.max(0, Math.min(index, count - 1))]?.focus({ cursor: 'all' }));
  }

  function handleCellChange(index: number, raw: string): void {
    if (composing) return;
    // The text of the cell without the character it showed before the edit (a typed character lands next to it).
    const previous = display(index);
    let incoming = raw;
    if (previous !== '' && incoming.length > previous.length) {
      if (incoming.startsWith(previous)) incoming = incoming.slice(previous.length);
      else if (incoming.endsWith(previous)) incoming = incoming.slice(0, incoming.length - previous.length);
    }
    apply(index, incoming);
  }

  function handleKeydown(index: number, event: KeyboardEvent): void {
    if (event.isComposing) return;
    const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (index < chars.length) apply(index, '');
      else if (index > 0) apply(index - 1, '');
    } else if (event.key === 'Delete') {
      event.preventDefault();
      if (index < chars.length) apply(index, '');
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const forward = (event.key === 'ArrowRight') !== rtl;
      focusCell(index + (forward ? 1 : -1));
    }
  }

  function handlePaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    // Nothing to paste (an empty clipboard, or no text in it) changes nothing: an empty text would remove a character.
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (pasted !== '') apply(index, pasted);
  }

  // A cell past the first empty one cannot be filled (the text has no gaps): focus goes to the first empty cell.
  function handleFocus(index: number, event: FocusEvent): void {
    const first = Math.min(chars.length, count - 1);
    if (index > first) focusCell(first);
    else (event.currentTarget as HTMLInputElement).select();
  }

  /** Moves focus to the first empty cell (the last one when all are filled). */
  export function focus(options?: InputFocusOptions): void {
    cells[Math.min(chars.length, count - 1)]?.focus(options);
  }

  /** Removes focus from the cell that has it. */
  export function blur(): void {
    for (const cell of cells) cell?.blur();
  }
</script>

<!--
  A group of single-character inputs. The characters live in one string (`value`), and cell `i` shows the `i`-th
  character of it, so the cells never have gaps. Each cell is an `Input`, so the sizes, variants and statuses are
  those of the input.
-->
<div
  {...rest}
  role="group"
  class={classList('ads-input-otp', customClass, classNames?.root)}
  style={styleText(customStyle, styles?.root)}
>
  {#each { length: count }, index (index)}
    <Input
      bind:this={cells[index]}
      bind:value={() => display(index), () => {}}
      type="text"
      style={cellStyle}
      classNames={{ input: classNames?.input }}
      styles={{ input: { 'text-align': 'center', ...styles?.input } }}
      {size}
      {variant}
      {status}
      {disabled}
      {autocomplete}
      autocapitalize="off"
      spellcheck={false}
      aria-label={cellLabel(index)}
      onchange={(next) => handleCellChange(index, next)}
      onkeydown={(event) => handleKeydown(index, event)}
      onpaste={(event) => handlePaste(index, event)}
      onfocus={(event) => handleFocus(index, event)}
      onclick={(event) => event.currentTarget.select()}
      oncompositionstart={() => (composing = true)}
      oncompositionend={() => (composing = false)}
    />
    {#if separator && index < count - 1}
      <span
        class={classList('ads-input-otp-separator', classNames?.separator)}
        style={styleText(styles?.separator)}
        >{#if typeof separator === 'string'}{separator}{:else}{@render separator(index)}{/if}</span
      >
    {/if}
  {/each}
</div>

<style>
  .ads-input-otp {
    display: inline-flex;
    align-items: center;
    gap: var(--ads-input-otp-gap);
    font-family: var(--ads-font-family);
  }

  .ads-input-otp-separator {
    display: inline-flex;
    flex: none;
    align-items: center;
    color: var(--ads-color-text);
  }
</style>
