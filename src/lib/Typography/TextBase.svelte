<script lang="ts">
  import { tick, untrack, type Snippet } from 'svelte';
  import CheckOutlined from '../Icon/icons/CheckOutlined.svelte';
  import CopyOutlined from '../Icon/icons/CopyOutlined.svelte';
  import EditOutlined from '../Icon/icons/EditOutlined.svelte';
  import EnterOutlined from '../Icon/icons/EnterOutlined.svelte';
  import LoadingOutlined from '../Icon/icons/LoadingOutlined.svelte';
  import InputTextArea from '../Input/InputTextArea.svelte';
  import Tooltip from '../Tooltip/Tooltip.svelte';
  import { isProduction } from '../internal/env.js';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';
  import { writeClipboard, writePromisedClipboard } from './copy.js';
  import Decorations from './Decorations.svelte';
  import { findCut, isClipped } from './ellipsis.js';
  import {
    TYPOGRAPHY_TYPES,
    type TypographyBaseProps,
    type TypographyCopyable,
    type TypographyEllipsis,
    type TypographyTooltipProps
  } from './types.js';

  /**
   * The body of Title, Paragraph, Text and Link: decorations, the bar of buttons (expand, edit, copy), the edit field and the
   * cut of long text. The four parts only choose the element (`tag`) and `kind`, and validate what is theirs (`level`, `href`).
   */
  type Props = Omit<TypographyBaseProps, 'children' | 'content' | 'editing' | 'expanded' | 'ellipsis'> & {
    tag: string;
    kind: 'title' | 'paragraph' | 'text' | 'link';
    level?: number;
    content?: string;
    editing?: boolean;
    expanded?: boolean;
    ellipsis?: boolean | TypographyEllipsis;
    children?: Snippet;
    [attribute: string]: unknown;
  };

  let {
    tag,
    kind,
    level,
    type,
    disabled = false,
    code = false,
    mark = false,
    underline = false,
    delete: deleted = false,
    strong = false,
    italic = false,
    keyboard = false,
    content = $bindable(),
    copyable = false,
    editable = false,
    editing = $bindable(false),
    ellipsis = false,
    expanded = $bindable(false),
    actions,
    shimmer = false,
    children,
    onclick,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    ...rest
  }: Props = $props();

  const COPIED_MS = 3000;
  const PLACEMENTS = ['start', 'end'] as const;

  let root: HTMLElement | undefined = $state();
  let textEl: HTMLElement | undefined = $state();
  let sourceEl: HTMLElement | undefined = $state();
  let actionsEl: HTMLElement | undefined = $state();
  let editButton: HTMLButtonElement | undefined = $state();
  let field: InputTextArea | undefined = $state();

  const inline = $derived(kind === 'text' || kind === 'link');

  // ---- the configuration ------------------------------------------------------------------------------------------
  const typeValue = $derived.by(() => {
    if (type === undefined) return undefined;
    if ((TYPOGRAPHY_TYPES as readonly string[]).includes(type)) return type;
    if (!isProduction()) throw new RangeError(`Typography type must be one of: ${TYPOGRAPHY_TYPES.join(', ')}.`);
    return undefined;
  });
  const copyConfig = $derived(copyable ? (typeof copyable === 'object' ? copyable : {}) : null);
  const editConfig = $derived(editable ? (typeof editable === 'object' ? editable : {}) : null);
  const ellipsisConfig = $derived<TypographyEllipsis | null>(ellipsis ? (typeof ellipsis === 'object' ? ellipsis : {}) : null);
  const placement = $derived(resolveOption('Typography', 'actions.placement', actions?.placement ?? 'end', PLACEMENTS, 'end'));

  const rows = $derived.by(() => {
    if (!ellipsisConfig || inline) return 1;
    const value = ellipsisConfig.rows;
    if (value === undefined) return 1;
    if (Number.isInteger(value) && value >= 1) return value;
    if (!isProduction()) throw new RangeError('Typography ellipsis.rows must be an integer, 1 or more.');
    return 1;
  });
  const expandable = $derived(inline ? false : (ellipsisConfig?.expandable ?? false));
  const collapsible = $derived(expandable === 'collapsible');
  const suffix = $derived(ellipsisConfig?.suffix ?? '');
  const triggerType = $derived(editConfig?.triggerType ?? ['icon']);
  const iconTrigger = $derived(!!editConfig && triggerType.includes('icon'));
  const textTrigger = $derived(!!editConfig && triggerType.includes('text'));
  const hasButton = $derived(!!copyConfig || iconTrigger);

  /** The text has to be cut by script: CSS cannot put a suffix or a button at the end of the last row. */
  const scriptMode = $derived(!!ellipsisConfig && (suffix !== '' || !!expandable || (rows >= 2 && hasButton)));
  const cssMode = $derived(!!ellipsisConfig && !scriptMode);
  const showActions = $derived(!!copyConfig || iconTrigger || (scriptMode && !!expandable));
  const showField = $derived(editing && !!editConfig);
  /** Children are drawn once more, hidden, when the text has to be read from them (edit, script cut). */
  const needsSource = $derived(content === undefined && !!children && (scriptMode || !!editConfig));

  const tags = $derived(
    [strong && 'strong', italic && 'i', underline && 'u', deleted && 'del', mark && 'mark', code && 'code', keyboard && 'kbd'].filter(
      (tag): tag is string => typeof tag === 'string'
    )
  );

  const shimmerOn = $derived(!!shimmer);
  const shimmerTimes = $derived.by((): [number, number] => {
    const duration = typeof shimmer === 'object' ? shimmer.duration : undefined;
    if (duration === undefined) return [1, 1];
    const [motion, wait] = typeof duration === 'number' ? [duration, 1] : duration;
    if (Number.isFinite(motion) && motion > 0 && Number.isFinite(wait) && wait >= 0) return [motion, wait];
    if (!isProduction()) throw new RangeError('Typography shimmer.duration must be a positive number or [motion, wait] in seconds.');
    return [1, 1];
  });

  // ---- reading the text -------------------------------------------------------------------------------------------
  /** The text that is on the page: the hidden copy of the children where there is one, else the text of the part. */
  const domText = (): string | null | undefined => (needsSource ? sourceEl : textEl)?.textContent;

  /** The text of the part, without its buttons. */
  function readText(): string {
    return content ?? domText() ?? '';
  }

  // ---- copy -------------------------------------------------------------------------------------------------------
  let copied = $state(false);
  /** A promised text is awaited: the button shows a spinner and starts no second request. */
  let copying = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const copyTips = $derived(copyConfig?.tooltips);
  const copyTip = $derived(copyTips === false ? null : copyTips ? copyTips[copied ? 1 : 0] : copied ? 'Copied' : 'Copy');
  const copyName = $derived(typeof copyTip === 'string' && copyTip !== '' ? copyTip : copied ? 'Copied' : 'Copy');

  async function copy(event: MouseEvent): Promise<void> {
    if (kind === 'link') event.preventDefault();
    if (copying) return;
    // The button exists only while there is a configuration.
    const config = copyConfig as TypographyCopyable;
    let done = false;
    try {
      const source = typeof config.text === 'function' ? config.text() : (config.text ?? readText());
      // A string is written at once; a promise is worth a spinner, and its write starts now, still inside the click.
      if (typeof source === 'string') done = await writeClipboard(source);
      else {
        clearTimeout(copyTimer);
        copied = false;
        copying = true;
        done = await writePromisedClipboard(source);
      }
    } catch {
      // The function of the text threw: a failed copy.
    }
    copying = false;
    clearTimeout(copyTimer);
    if (!done) {
      copied = false;
      return;
    }
    copied = true;
    copyTimer = setTimeout(() => (copied = false), COPIED_MS);
    config.oncopy?.(event);
  }

  $effect(() => () => clearTimeout(copyTimer));

  // ---- edit -------------------------------------------------------------------------------------------------------
  let draft = $state('');
  let startText = '';
  /** The field was open from the first render: the text is read once the page has it. */
  let readLater = false;
  let userStart = false;
  let wasEditing = false;
  let finishing = false;
  let tabbing = false;

  const editTip = $derived(editConfig?.tooltip === false ? null : (editConfig?.tooltip ?? 'Edit'));
  const editName = $derived(typeof editTip === 'string' && editTip !== '' ? editTip : 'Edit');

  /** The text of a part is one line: a line break typed during a composition, or pasted, is dropped. */
  const singleLine = (text: string): string => text.replace(/[\r\n]+/g, '');

  function startEditing(): void {
    userStart = true;
    editing = true;
  }

  // Before the DOM changes (the text is still there to read) the starting text is fixed, however the editing was opened.
  $effect.pre(() => {
    const now = editing;
    untrack(() => {
      if (now && !wasEditing && editConfig) {
        const text = editConfig.text ?? content ?? domText();
        readLater = text === undefined || text === null;
        startText = text ?? '';
        draft = startText;
        if (userStart) editConfig.onstart?.();
      }
      userStart = false;
      wasEditing = now;
    });
  });

  $effect(() => {
    if (!showField) return;
    untrack(() => {
      if (readLater) {
        readLater = false;
        startText = readText();
        draft = startText;
      }
      void tick().then(() => field?.focus({ cursor: 'end' }));
    });
  });

  function finish(kindOfEnd: 'confirm' | 'cancel', via: 'key' | 'tab' | 'blur'): void {
    if (!editing || finishing) return;
    finishing = true;
    const text = draft;
    const config = editConfig;
    editing = false;
    if (kindOfEnd === 'confirm') {
      if (text !== startText) {
        if (content !== undefined) content = text;
        config?.onchange?.(text);
      }
      config?.onend?.();
    } else {
      config?.oncancel?.();
    }
    if (via !== 'blur') void tick().then(() => editButton?.focus());
    finishing = false;
  }

  function fieldKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) finish('confirm', 'key');
    } else if (event.key === 'Escape') {
      if (event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      finish('cancel', 'key');
    } else if (event.key === 'Tab') {
      tabbing = true;
    }
  }

  function fieldBlur(): void {
    const viaTab = tabbing;
    tabbing = false;
    finish('confirm', viaTab ? 'tab' : 'blur');
  }

  function rootClick(event: MouseEvent): void {
    onclick?.(event);
    if (!textTrigger || editing || !root) return;
    const target = event.target as Element;
    const control = target.closest('.ads-typography-actions, button, input, textarea, select');
    if (control && root.contains(control)) return;
    if (kind !== 'link') {
      const anchor = target.closest('a');
      if (anchor && anchor !== root && root.contains(anchor)) return;
    }
    if (typeof window !== 'undefined' && window.getSelection()?.toString()) return;
    startEditing();
  }

  // ---- ellipsis ---------------------------------------------------------------------------------------------------
  /** `undefined`: not measured yet; `null`: the whole text fits; a string: the text before the cut. */
  let cut: string | null | undefined = $state(undefined);
  let fullText = $state('');
  let truncated = $state(false);
  let measured = $state(false);
  let measureFrame = 0;

  const showCut = $derived(scriptMode && !expanded && typeof cut === 'string');
  const showExpand = $derived(!!expandable && (expanded ? collapsible : typeof cut === 'string'));
  const pending = $derived(scriptMode && cut === undefined && !expanded);
  /** The text is clamped by CSS: several rows with no buttons, or a script cut that is not measured yet. */
  const clamped = $derived((cssMode && rows >= 2) || pending);

  function lineHeightOf(element: HTMLElement): number {
    const style = getComputedStyle(element);
    const line = parseFloat(style.lineHeight);
    return Number.isFinite(line) ? line : parseFloat(style.fontSize) * 1.5;
  }

  /** The width the text may use: the part itself, or for an inline part the room its parent gives it. */
  function roomOf(element: HTMLElement): number {
    if (inline) {
      const parent = element.parentElement as HTMLElement;
      const style = getComputedStyle(parent);
      const room = parent.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      if (room > 0) return room;
    }
    return element.clientWidth;
  }

  /** Cuts `text` so that it, the dots, the suffix and the buttons fit in `rows` rows. */
  function cutFor(element: HTMLElement, text: string): string | null {
    const ruler = document.createElement('span');
    ruler.setAttribute('aria-hidden', 'true');
    ruler.style.cssText = `position:absolute;top:0;inset-inline-start:0;display:block;width:${roomOf(element)}px;visibility:hidden;pointer-events:none`;
    // Every node, as the browser really lays them out.
    for (const child of Array.from(element.childNodes)) {
      if (child === ruler || child === sourceEl) continue;
      ruler.appendChild(child.cloneNode(true));
    }
    element.appendChild(ruler);
    try {
      // Both are in the clone of the part: the text span and the element the text stands in.
      const rulerText = ruler.querySelector('.ads-typography-content') as HTMLElement;
      const host = ruler.querySelector('[data-ads-host]') as HTMLElement;
      rulerText.style.cssText = 'display:inline;overflow:visible';
      // Before the first measurement the suffix is not drawn yet: it is added here.
      if (suffix !== '' && !ruler.querySelector('.ads-typography-suffix')) {
        const tail = document.createElement('span');
        tail.className = 'ads-typography-suffix';
        tail.textContent = suffix;
        rulerText.after(tail);
      }
      const bar = ruler.querySelector<HTMLElement>('.ads-typography-actions');
      if (bar) bar.hidden = false;
      const expandButton = ruler.querySelector<HTMLElement>('[data-ads-expand]');
      const limit = lineHeightOf(element) * rows + 1;
      return findCut(text, (candidate) => {
        const whole = candidate === text;
        host.textContent = whole ? candidate : `${candidate.trimEnd()}...`;
        if (expandButton) expandButton.hidden = whole;
        return ruler.getBoundingClientRect().height <= limit;
      });
    } finally {
      ruler.remove();
    }
  }

  function measureScript(): void {
    // No text span: the field is open, or the part is gone (a frame that was scheduled earlier).
    if (!textEl || expanded) return;
    const text = readText();
    fullText = text;
    cut = cutFor(root as HTMLElement, text);
    truncated = cut !== null;
    measured = true;
  }

  function measureClipped(element: HTMLElement): void {
    truncated = isClipped(element);
    measured = true;
  }

  function schedule(measure: () => void): void {
    cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measure);
  }

  // The script cut: measured when anything it depends on changes (before the first paint on the client), and on a resize.
  $effect(() => {
    void [scriptMode, rows, suffix, expanded, showField, content, expandable, hasButton, tags.length, root, textEl];
    if (!scriptMode || showField) {
      cut = undefined;
      return;
    }
    untrack(measureScript);
  });

  $effect(() => {
    const element = root;
    if (!element || !scriptMode || showField || typeof ResizeObserver === 'undefined') return;
    let last = roomOf(element);
    const observer = new ResizeObserver(() => {
      const room = roomOf(element);
      if (Math.abs(room - last) < 1) return;
      last = room;
      schedule(measureScript);
    });
    observer.observe(element);
    if (inline) observer.observe(element.parentElement as HTMLElement);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(measureFrame);
    };
  });

  // The children are the text: when they change, the cut is measured again.
  $effect(() => {
    const element = sourceEl;
    if (!element || !scriptMode || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => schedule(measureScript));
    observer.observe(element, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  });

  // CSS only: the state "cut" is read from the box when somebody asks for it (`onellipsis`), and the tip asks at the first hover.
  $effect(() => {
    const element = textEl;
    if (!cssMode || !ellipsisConfig?.onellipsis || !element) return;
    untrack(() => measureClipped(element));
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => schedule(() => measureClipped(element)));
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(measureFrame);
    };
  });

  // After the first measurement and then at every change of the state (a derived value that did not change runs nothing).
  $effect(() => {
    const state = truncated;
    if (!measured) return;
    untrack(() => ellipsisConfig?.onellipsis?.(state));
  });

  function toggleExpand(event: MouseEvent): void {
    const next = !expanded;
    expanded = next;
    ellipsisConfig?.onexpand?.(event, { expanded: next });
  }

  // ---- the tip with the full text ---------------------------------------------------------------------------------
  let tipOpen = $state(false);
  let tipText = $state('');

  const tip = $derived.by((): { title?: string | number | Snippet | null; props: TypographyTooltipProps } | null => {
    const value = ellipsisConfig?.tooltip;
    if (!value) return null;
    if (value === true) return { props: {} };
    if (typeof value === 'string' || typeof value === 'function') return { title: value, props: {} };
    const { title, ...props } = value;
    return { title, props };
  });

  function isCut(): boolean {
    if (expanded) return false;
    if (scriptMode) return typeof cut === 'string';
    return !!textEl && isClipped(textEl);
  }

  function setTipOpen(next: boolean): void {
    if (next) {
      if (!isCut()) return;
      tipText = readText();
    }
    tipOpen = next;
  }

  // ---- classes and styles -----------------------------------------------------------------------------------------
  const rootClass = $derived(
    classList(
      'ads-typography',
      `ads-typography-${kind}`,
      kind === 'title' && `ads-typography-title-${level}`,
      typeValue && `ads-typography-${typeValue}`,
      kind === 'link' && !typeValue && !disabled && 'ads-typography-link-plain',
      disabled && 'ads-typography-disabled',
      !!ellipsisConfig && 'ads-typography-ellipsis',
      cssMode && (rows >= 2 ? 'ads-typography-clamp' : 'ads-typography-single'),
      scriptMode && 'ads-typography-cut',
      pending && 'ads-typography-pending',
      expanded && scriptMode && 'ads-typography-expanded',
      showField && 'ads-typography-editing',
      shimmerOn && 'ads-typography-shimmer',
      customClass,
      classNames?.root
    )
  );
  const rootStyle = $derived(
    styleText(
      !!ellipsisConfig && `--ads-typography-rows: ${rows}`,
      shimmerOn && `--ads-typography-shimmer-motion: ${shimmerTimes[0]}; --ads-typography-shimmer-wait: ${shimmerTimes[1]}`,
      customStyle,
      styles?.root
    )
  );
  const actionsClass = $derived(
    classList('ads-typography-actions', placement === 'start' && 'ads-typography-actions-start', classNames?.actions)
  );
  const actionClass = (name: string) => classList('ads-typography-action', name, classNames?.action);
  const textareaStyle = $derived({ 'font-size': 'inherit', 'line-height': 'inherit', ...styles?.textarea });

  $effect(() => {
    if (!isProduction() && content !== undefined && children) {
      console.warn('Typography: both `content` and `children` are given; `content` is shown and `children` is ignored.');
    }
  });
</script>

{#snippet body()}
  {#if showCut}
    <span aria-hidden="true">{cut}</span><span aria-hidden="true">...</span><span class="ads-typography-sr">{fullText}</span>
  {:else if content !== undefined}
    {content}
  {:else}
    {@render children?.()}
  {/if}
{/snippet}

{#snippet decorated(index: number)}
  {#if index < tags.length}
    <svelte:element this={tags[index]}>{@render decorated(index + 1)}</svelte:element>
  {:else}
    <span class="ads-typography-host" data-ads-host>{@render body()}</span>
  {/if}
{/snippet}

{#snippet tipFull()}{tipText}{/snippet}

{#snippet textPart()}
  <!-- The number of rows is set here: `-webkit-line-clamp` has no standard name that every engine of the browser floor knows. -->
  <span class="ads-typography-content" style={clamped ? `-webkit-line-clamp: ${rows}` : undefined} bind:this={textEl}>{@render decorated(0)}</span>
{/snippet}

{#snippet withTip(title: string | number | Snippet | null | undefined, button: Snippet)}
  {#if title !== null && title !== undefined && title !== ''}
    <Tooltip {title}>{@render button()}</Tooltip>
  {:else}
    {@render button()}
  {/if}
{/snippet}

{#snippet expandButton()}
  <button
    type="button"
    data-ads-expand
    class={actionClass(expanded ? 'ads-typography-collapse' : 'ads-typography-expand')}
    style={styleText(styles?.action)}
    aria-expanded={expanded ? 'true' : 'false'}
    hidden={!showExpand}
    onclick={toggleExpand}
  >
    {#if typeof ellipsisConfig?.symbol === 'function'}
      {@render ellipsisConfig.symbol(expanded)}
    {:else if ellipsisConfig?.symbol !== undefined && !expanded}
      {ellipsisConfig.symbol}
    {:else}
      {expanded ? 'Collapse' : 'Expand'}
    {/if}
  </button>
{/snippet}

{#snippet editAction()}
  <button
    type="button"
    class={actionClass('ads-typography-edit')}
    style={styleText(styles?.action)}
    aria-label={editName}
    tabindex={editConfig?.tabIndex}
    bind:this={editButton}
    onclick={(event) => {
      if (kind === 'link') event.preventDefault();
      startEditing();
    }}
  >
    {#if editConfig?.icon}
      {@render editConfig.icon()}
    {:else}
      <EditOutlined label="" />
    {/if}
  </button>
{/snippet}

{#snippet copyAction()}
  <button
    type="button"
    class={classList(actionClass('ads-typography-copy'), copied && 'ads-typography-copy-success', copying && 'ads-typography-copy-loading')}
    style={styleText(styles?.action)}
    aria-label={copyName}
    aria-busy={copying ? 'true' : undefined}
    aria-disabled={copying ? 'true' : undefined}
    tabindex={copyConfig?.tabIndex}
    onclick={copy}
  >
    {#if copying}
      <LoadingOutlined label="" />
    {:else if copyConfig?.icon}
      {@render copyConfig.icon(copied)}
    {:else if copied}
      <CheckOutlined label="" />
    {:else}
      <CopyOutlined label="" />
    {/if}
  </button>
{/snippet}

{#snippet bar()}
  {#if showActions}
    <span class={actionsClass} style={styleText(styles?.actions)} bind:this={actionsEl} hidden={pending}>
      {#if scriptMode && expandable}{@render expandButton()}{/if}
      {#if iconTrigger}{@render withTip(editTip, editAction)}{/if}
      {#if copyConfig}
        {@render withTip(copyTip, copyAction)}
        <span class="ads-typography-sr" role="status">{copied ? copyName : ''}</span>
      {/if}
    </span>
  {/if}
{/snippet}

<Decorations />

<svelte:element
  this={tag}
  {...rest}
  bind:this={root}
  class={rootClass}
  style={rootStyle}
  aria-busy={shimmerOn ? 'true' : undefined}
  onclick={rootClick}
>
  {#if showField}
    <span class="ads-typography-edit-content">
      <InputTextArea
        bind:this={field}
        bind:value={() => draft, (next) => (draft = singleLine(next as string))}
        autoSize={editConfig?.autoSize ?? true}
        maxlength={editConfig?.maxLength}
        aria-label={editName}
        style="display:block;width:100%;font-size:inherit;line-height:inherit"
        classNames={{ textarea: classNames?.textarea }}
        styles={{ textarea: textareaStyle }}
        onkeydown={fieldKeydown}
        onblur={fieldBlur}
      />
      {#if editConfig?.enterIcon !== null}
        <span class="ads-typography-enter" aria-hidden="true">
          {#if editConfig?.enterIcon}{@render editConfig.enterIcon()}{:else}<EnterOutlined label="" />{/if}
        </span>
      {/if}
    </span>
  {:else}
    <!-- No white space between the parts: a space would sit between the dots and the suffix, and in front of the buttons. -->
    {#if placement === 'start'}{@render bar()}{/if}{#if tip}<Tooltip {...tip?.props} title={tip?.title ?? tipFull} bind:open={() => tipOpen, setTipOpen}>{@render textPart()}</Tooltip>{:else}{@render textPart()}{/if}{#if scriptMode && suffix !== '' && cut !== undefined}<span class="ads-typography-suffix">{suffix}</span>{/if}{#if placement !== 'start'}{@render bar()}{/if}
  {/if}{#if needsSource}<span hidden bind:this={sourceEl}>{@render children?.()}</span>{/if}
</svelte:element>

<style>
  .ads-typography {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: var(--ads-typography-color);
    overflow-wrap: break-word;
  }

  /* ---- the four parts ---- */
  .ads-typography-paragraph {
    display: block;
    margin-block-end: var(--ads-typography-paragraph-margin-bottom);
    font-family: var(--ads-font-family);
    font-size: var(--ads-typography-font-size);
    line-height: var(--ads-typography-line-height);
  }

  .ads-typography-title {
    display: block;
    margin-block: var(--ads-typography-title-margin-top) var(--ads-typography-title-margin-bottom);
    font-family: var(--ads-font-family);
    font-weight: var(--ads-typography-title-weight);
  }

  .ads-typography-title:first-child {
    margin-block-start: 0;
  }

  .ads-typography-title-1 {
    font-size: var(--ads-typography-h1-font-size);
    line-height: var(--ads-typography-h1-line-height);
  }

  .ads-typography-title-2 {
    font-size: var(--ads-typography-h2-font-size);
    line-height: var(--ads-typography-h2-line-height);
  }

  .ads-typography-title-3 {
    font-size: var(--ads-typography-h3-font-size);
    line-height: var(--ads-typography-h3-line-height);
  }

  .ads-typography-title-4 {
    font-size: var(--ads-typography-h4-font-size);
    line-height: var(--ads-typography-h4-line-height);
  }

  .ads-typography-title-5 {
    font-size: var(--ads-typography-h5-font-size);
    line-height: var(--ads-typography-h5-line-height);
  }

  .ads-typography-link {
    color: var(--ads-typography-link-color);
    text-decoration: var(--ads-typography-link-decoration);
    cursor: pointer;
    outline: none;
    transition: color var(--ads-typography-transition);
  }

  .ads-typography-link.ads-typography-disabled {
    text-decoration: none;
  }

  .ads-typography-link-plain:hover {
    color: var(--ads-typography-link-hover-color);
  }

  .ads-typography-link-plain:active {
    color: var(--ads-typography-link-active-color);
  }

  .ads-typography-link:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  /* ---- type and disabled ---- */
  .ads-typography-secondary {
    color: var(--ads-typography-secondary-color);
  }

  .ads-typography-success {
    color: var(--ads-typography-success-color);
  }

  .ads-typography-warning {
    color: var(--ads-typography-warning-color);
  }

  .ads-typography-danger {
    color: var(--ads-typography-danger-color);
  }

  .ads-typography-disabled {
    color: var(--ads-typography-disabled-color);
    cursor: not-allowed;
  }

  /* ---- the bar of buttons ---- */
  .ads-typography-actions {
    display: inline-flex;
    flex: none;
    align-items: baseline;
    gap: var(--ads-typography-actions-gap);
    margin-inline-start: var(--ads-typography-actions-gap);
    white-space: nowrap;
  }

  .ads-typography-actions-start {
    margin-inline: 0 var(--ads-typography-actions-gap);
  }

  .ads-typography-actions[hidden],
  .ads-typography-action[hidden] {
    display: none;
  }

  .ads-typography-action {
    display: inline-block;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ads-typography-action-color);
    font: inherit;
    line-height: inherit;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    transition: color var(--ads-typography-transition);
  }

  .ads-typography-action:hover {
    color: var(--ads-typography-action-hover-color);
  }

  .ads-typography-action:active {
    color: var(--ads-typography-action-active-color);
  }

  .ads-typography-copy-loading {
    cursor: default;
  }

  .ads-typography-action:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  /* Visually hidden, still read: the status after a copy, and the whole text of a cut part. */
  .ads-typography-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    border: 0;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ---- the edit field: it overhangs the line and moves nothing (measured on the Ant Design demo) ---- */
  .ads-typography-edit-content {
    position: relative;
    display: block;
    inset-inline-start: calc(-1 * var(--ads-typography-edit-offset-inline));
    width: 100%;
    margin-block: calc(-1 * var(--ads-typography-edit-offset-block));
  }

  .ads-typography-text .ads-typography-edit-content,
  .ads-typography-link .ads-typography-edit-content {
    display: inline-block;
  }

  .ads-typography-enter {
    position: absolute;
    inset-inline-end: 10px;
    bottom: 8px;
    display: inline-flex;
    color: var(--ads-typography-enter-color);
    font-size: 14px;
    line-height: 0;
    pointer-events: none;
  }

  /* ---- ellipsis ---- */
  .ads-typography-single {
    display: flex;
    align-items: baseline;
    min-width: 0;
    max-width: 100%;
  }

  .ads-typography-single.ads-typography-text,
  .ads-typography-single.ads-typography-link {
    display: inline-flex;
    vertical-align: bottom;
  }

  .ads-typography-single .ads-typography-content {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ads-typography-clamp .ads-typography-content,
  .ads-typography-pending .ads-typography-content {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ads-typography-cut {
    position: relative;
  }

  .ads-typography-cut.ads-typography-text,
  .ads-typography-cut.ads-typography-link {
    display: inline-block;
    max-width: 100%;
    vertical-align: bottom;
  }

  /* ---- shimmer: a band of the page color moves over the text; the text is painted by a gradient clipped to it ---- */
  .ads-typography-shimmer {
    background-image:
      linear-gradient(90deg, transparent, var(--ads-typography-shimmer-highlight), transparent),
      linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat;
    background-size:
      40% 100%,
      100% 100%;
    background-position:
      166.667% 0,
      0 0;
    /* The standard name first, the prefixed one (the only one the browser floor reads `text` from) wins. */
    background-clip: border-box;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ads-typography-shimmer
      calc((var(--ads-typography-shimmer-motion) + var(--ads-typography-shimmer-wait)) * 1s) linear infinite;
  }

  @keyframes ads-typography-shimmer {
    from {
      background-position:
        166.667% 0,
        0 0;
    }

    to {
      background-position:
        calc(
          166.667% - 233.333% * (var(--ads-typography-shimmer-motion) + var(--ads-typography-shimmer-wait)) /
            var(--ads-typography-shimmer-motion)
        )
        0,
        0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-typography-shimmer {
      animation: none;
      background-image: none;
      -webkit-text-fill-color: currentColor;
    }

    .ads-typography-link,
    .ads-typography-action {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .ads-typography-shimmer {
      animation: none;
      background-image: none;
      -webkit-text-fill-color: currentColor;
    }

    .ads-typography-disabled {
      color: GrayText;
    }

    .ads-typography-link,
    .ads-typography-action {
      color: LinkText;
    }
  }
</style>
