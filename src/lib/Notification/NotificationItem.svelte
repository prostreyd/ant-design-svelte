<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { classList, styleText } from '../internal/semantic.js';
  import Icon from '../internal/icons/Icon.svelte';
  import { playEnter, playLeave, type MotionOptions, type MotionSide } from '../internal/anim/motion.js';
  import { inertWhen } from '../internal/pile/pile.svelte.js';
  import NotificationProgress from './NotificationProgress.svelte';
  import { closeById, finalize, setPaused, type NotificationRecord, type NotificationSettings } from './store.js';
  import type { NotificationContent, NotificationPlacement, NotificationSemanticName, NotificationType } from './types.js';

  /** One notification: the slot it takes in its list, and the box inside it. */
  type ItemProps = {
    record: NotificationRecord;
    /** How far it is from the newest of its place: 0 is the newest, which stands nearest the window edge. */
    index: number;
    /** How many rows the place has, closing ones included. */
    count: number;
    placement: NotificationPlacement;
    settings: NotificationSettings;
    /** The place is a collapsed pile: the notifications lie behind the newest one. */
    piled: boolean;
    /** `stack` is on, so the gaps between the rows count as the pile. */
    stacked: boolean;
  };

  let { record, index, count, placement, settings, piled, stacked }: ItemProps = $props();

  let slot = $state<HTMLElement | null>(null);
  let item = $state<HTMLElement | null>(null);

  const bottom = $derived(placement === 'bottom' || placement === 'bottomLeft' || placement === 'bottomRight');
  // A notification comes from the side of its place and leaves to it. The gap to the next row is under a row at a top place and over
  // it at a bottom place, so that the newest stands at the edge with no gap beyond it.
  const motion = (): MotionOptions => {
    const from: MotionSide = placement.endsWith('Right') ? 'right' : placement.endsWith('Left') ? 'left' : bottom ? 'bottom' : 'top';
    return { offsetToken: '--ads-notification-motion-offset', from, gap: bottom ? 'start' : 'end' };
  };

  // The icon of each type. `open` has none of its own: it shows an icon only when it is given one.
  const ICON = { open: 'info', info: 'info', success: 'success', error: 'error', warning: 'warning' } as const satisfies Record<NotificationType, string>;

  const type = $derived(record.type);
  const word = $derived(settings.labels[type]);
  // A failure interrupts a screen reader (`alert`); the rest wait for it to finish (`status`). `role` overrides.
  const role = $derived(record.role ?? (type === 'error' || type === 'warning' ? 'alert' : 'status'));
  const hasIcon = $derived(record.icon === undefined ? type !== 'open' : record.icon !== false);
  const closeIcon = $derived(record.closeIcon !== undefined ? record.closeIcon : settings.closeIcon);
  const closable = $derived((record.closable ?? settings.closable) && closeIcon !== false);
  const showProgress = $derived((record.showProgress ?? settings.showProgress) && record.duration > 0);
  // The older notifications of a collapsed pile cannot be seen, so they cannot take focus or be read again.
  const buried = $derived(piled && index > 0);

  // The close button is as wide as its content (a word is wider than the cross), and the title keeps out from under it: the button
  // is out of the flow, so its width is measured and the room the title leaves for it grows by what the button is wider than its size.
  let closeWidth = $state(0);
  // Read once and again when it changes. Where there is no `ResizeObserver` (an old engine, a test environment) the first reading stays.
  const trackCloseWidth: Attachment<HTMLElement> = (node) => {
    closeWidth = node.offsetWidth;
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => (closeWidth = node.offsetWidth));
    observer.observe(node);
    return () => observer.disconnect();
  };

  // Where a part gets its class or style: the notification's own wins over the one of the host or `notification.config()`.
  const part = (name: NotificationSemanticName) => record.classNames?.[name] ?? settings.classNames[name];
  const partStyle = (name: NotificationSemanticName) => record.styles?.[name] ?? settings.styles[name];

  // Comes in once. A notification that was already on the page when its layer was created (the layer of the library handing over to
  // a `NotificationHost`) has no motion of its own. `shift`: the newest row pushes the others away from the edge, so its slot grows
  // instead of the others jumping.
  onMount(() => {
    if (slot && item && Date.now() - record.createdAt < 150) playEnter(slot, item, index === 0 && count > 1, motion());
  });

  let leaving = false;
  $effect(() => {
    if (record.state !== 'closing' || leaving || !slot || !item) return;
    leaving = true;
    const id = record.id;
    const [s, i] = [slot, item];
    untrack(() => {
      void playLeave(s, i, motion()).then(() => finalize(id));
    });
  });

  // The box is made again by an update with the same key (so that a screen reader reads it as new). A focused element inside it is
  // gone then, and no `focusout` tells; without this the timer would wait for a focus that is not there.
  $effect(() => {
    void record.revision;
    const id = untrack(() => record.id);
    if (item && !item.contains(document.activeElement)) setPaused(id, 'focus', false);
  });

  const hover = (on: boolean) => (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (record.pauseOnHover) setPaused(record.id, 'hover', on);
  };

  function onfocusout(event: FocusEvent): void {
    if (!item?.contains(event.relatedTarget as Node | null)) setPaused(record.id, 'focus', false);
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !event.isComposing) closeById(record.id);
  }

  function close(event: MouseEvent): void {
    event.stopPropagation();
    closeById(record.id);
  }
</script>

{#snippet content(value: NotificationContent)}
  {#if typeof value === 'function'}{@render value()}{:else}{value}{/if}
{/snippet}

<div
  class="ads-notification-slot"
  class:ads-notification-slot-stack={stacked && record.state === 'open'}
  data-row-id={`${record.id}`}
  data-bottom={bottom ? '' : undefined}
  data-depth={piled ? Math.min(index, 3) : undefined}
  style={`--ads-notification-i: ${index}; --ads-notification-d: ${Math.min(index, 2)}`}
  style:z-index={piled ? 100 - index : undefined}
  bind:this={slot}
>
  <div
    class="ads-notification-item"
    class:ads-notification-leaving={record.state === 'closing'}
    {@attach inertWhen(() => buried)}
    aria-hidden={buried ? 'true' : undefined}
    bind:this={item}
    onpointerenter={hover(true)}
    onpointerleave={hover(false)}
    onfocusin={() => setPaused(record.id, 'focus', true)}
    {onfocusout}
    {onkeydown}
  >
    {#key record.revision}
      <div
        {...record.props}
        class={classList('ads-notification', `ads-notification-${type}`, closable && 'ads-notification-closable', record.class, part('root'))}
        style={styleText(closable && closeWidth > 0 && `--ads-notification-close-width: ${closeWidth}px`, record.style, partStyle('root'))}
        {role}
        onclick={(event) => record.onclick?.(event)}
      >
        <div class="ads-notification-body">
          {#if hasIcon}
            <span class={classList('ads-notification-icon', part('icon'))} style={styleText(partStyle('icon'))} aria-hidden="true">
              {#if record.icon === undefined}
                <Icon name={ICON[type]} class="ads-notification-svg" />
              {:else if typeof record.icon === 'function'}
                {@render record.icon()}
              {:else}
                {record.icon}
              {/if}
            </span>
          {/if}
          <div class={classList('ads-notification-section', part('section'))} style={styleText(partStyle('section'))}>
            <div class={classList('ads-notification-title', part('title'))} style={styleText(partStyle('title'))}>
              {#if word}<span class="ads-notification-word">{`${word}: `}</span>{/if}
              {@render content(record.title)}
            </div>
            {#if record.description !== undefined}
              <div class={classList('ads-notification-description', part('description'))} style={styleText(partStyle('description'))}>
                {@render content(record.description)}
              </div>
            {/if}
          </div>
        </div>
        {#if record.actions !== undefined}
          <div class={classList('ads-notification-actions', part('actions'))} style={styleText(partStyle('actions'))}>
            {@render content(record.actions)}
          </div>
        {/if}
        {#if closable}
          <button
            type="button"
            class={classList('ads-notification-close', part('close'))}
            style={styleText(partStyle('close'))}
            aria-label={settings.labels.close}
            tabindex={buried ? -1 : undefined}
            {@attach trackCloseWidth}
            onclick={close}
          >
            {#if closeIcon === undefined}
              <Icon name="close" class="ads-notification-close-svg" />
            {:else if typeof closeIcon === 'function'}
              {@render closeIcon()}
            {:else}
              {closeIcon}
            {/if}
          </button>
        {/if}
        {#if showProgress}
          <NotificationProgress
            id={record.id}
            duration={record.duration}
            class={classList('ads-notification-progress', part('progress'))}
            style={styleText(partStyle('progress'))}
          />
        {/if}
      </div>
    {/key}
  </div>
</div>

<style>
  /* One row of the list. Its gap to the next row is a padding, so that a leaving row takes the gap with it: under it at a top place,
     over it at a bottom place (the newest stands at the edge, with no gap beyond it). */
  .ads-notification-slot {
    box-sizing: border-box;
    max-width: 100%;
    padding-block-end: var(--ads-notification-gap);
    pointer-events: none;
  }

  .ads-notification-slot[data-bottom] {
    padding-block-end: 0;
    padding-block-start: var(--ads-notification-gap);
  }

  /* With `stack` the rows and the gaps between them count as the pile: the pointer must not fall through a gap. */
  .ads-notification-slot-stack {
    pointer-events: auto;
  }

  .ads-notification-item {
    max-width: 100%;
    pointer-events: none;
    transition:
      transform var(--ads-motion-duration) var(--ads-motion-ease),
      opacity var(--ads-motion-duration) var(--ads-motion-ease);
  }

  /* A notification that is leaving is closed already: it stays on the page for the length of its exit, and must not take a click meant
     for what is under it, nor call its `onclick`. */
  .ads-notification-leaving .ads-notification {
    pointer-events: none;
  }

  /* Behind the newest notification of a collapsed pile: moved away from the edge, smaller (the scale stops at the second step), and the
     ones past the third are not shown. At a top place the rows go down and lean on their bottom edge, at a bottom place the mirror. */
  :global(.ads-notification-piled) .ads-notification-item {
    transform-origin: bottom center;
    transform: translateY(calc(var(--ads-notification-i) * var(--ads-notification-stack-offset)))
      scale(calc(1 - var(--ads-notification-d) * var(--ads-notification-stack-scale-step)));
  }

  :global(.ads-notification-piled) .ads-notification-slot[data-bottom] .ads-notification-item {
    transform-origin: top center;
    transform: translateY(calc(var(--ads-notification-i) * var(--ads-notification-stack-offset) * -1))
      scale(calc(1 - var(--ads-notification-d) * var(--ads-notification-stack-scale-step)));
  }

  /* In a pile every row lies on the newest. */
  :global(.ads-notification-piled) .ads-notification-slot {
    grid-area: 1 / 1;
    justify-self: center;
  }

  /* The rows past the third are not shown, and must not catch the pointer. */
  :global(.ads-notification-piled) .ads-notification-slot[data-depth='3'] {
    pointer-events: none;
  }

  :global(.ads-notification-piled) .ads-notification-slot[data-depth='3'] .ads-notification-item {
    opacity: 0;
  }

  .ads-notification {
    position: relative;
    box-sizing: border-box;
    width: var(--ads-notification-width);
    max-width: 100%;
    padding: var(--ads-notification-padding);
    border-radius: var(--ads-notification-radius);
    color: var(--ads-notification-color);
    background: var(--ads-notification-bg);
    box-shadow: var(--ads-notification-shadow);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: var(--ads-notification-line-height);
    text-align: start;
    pointer-events: auto;
  }

  .ads-notification-body {
    display: flex;
    align-items: flex-start;
    gap: var(--ads-notification-icon-gap);
  }

  /* As tall as the line of the title, so that the box is the same height with or without an icon. */
  .ads-notification-icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    height: var(--ads-notification-title-line-height);
    font-size: var(--ads-notification-icon-size);
    line-height: 1;
  }

  .ads-notification-icon :global(svg) {
    font-size: var(--ads-notification-icon-size);
  }

  .ads-notification-info .ads-notification-icon {
    color: var(--ads-notification-icon-info);
  }

  .ads-notification-success .ads-notification-icon {
    color: var(--ads-notification-icon-success);
  }

  .ads-notification-error .ads-notification-icon {
    color: var(--ads-notification-icon-error);
  }

  .ads-notification-warning .ads-notification-icon {
    color: var(--ads-notification-icon-warning);
  }

  .ads-notification-section {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .ads-notification-title {
    font-size: var(--ads-notification-title-size);
    line-height: var(--ads-notification-title-line-height);
  }

  /* Room for the close button at the end of the first line; a button wider than its size (a word for the cross) takes the rest. */
  .ads-notification-closable .ads-notification-title {
    padding-inline-end: calc(
      var(--ads-notification-close-room) + max(0px, var(--ads-notification-close-width, 0px) - var(--ads-notification-close-size))
    );
  }

  .ads-notification-description {
    margin-block-start: var(--ads-notification-description-gap);
  }

  .ads-notification-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-block-start: var(--ads-notification-actions-gap);
  }

  /* The type, for a screen reader only. */
  .ads-notification-word {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .ads-notification-close {
    position: absolute;
    inset-block-start: calc(var(--ads-notification-padding-block) + (var(--ads-notification-title-line-height) - var(--ads-notification-close-size)) / 2);
    inset-inline-end: calc(var(--ads-notification-padding-inline) - 1px);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: var(--ads-notification-close-size);
    height: var(--ads-notification-close-size);
    margin: 0;
    padding: 0 var(--ads-notification-close-padding);
    border: 0;
    white-space: nowrap;
    border-radius: var(--ads-radius-sm);
    color: var(--ads-notification-close-color);
    background: var(--ads-notification-close-bg);
    font-size: var(--ads-notification-close-icon-size);
    cursor: pointer;
    transition:
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-notification-close:hover {
    color: var(--ads-notification-close-color-hover);
    background: var(--ads-notification-close-bg-hover);
  }

  .ads-notification-close:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  /* The strip stands at the bottom edge of the box, a little in from both sides. */
  .ads-notification :global(.ads-notification-progress) {
    position: absolute;
    inset-inline: var(--ads-notification-progress-inset);
    inset-block-end: 0;
    height: var(--ads-notification-progress-height);
    border-radius: var(--ads-notification-progress-radius);
    background: var(--ads-notification-progress-track);
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-notification-item,
    .ads-notification-close {
      transition: none;
    }
  }

  /* The shadow and the colors are replaced by the system ones: without a border the box would melt into the page. */
  @media (forced-colors: active) {
    .ads-notification {
      border: 1px solid CanvasText;
    }

    .ads-notification-icon {
      color: CanvasText;
    }

    .ads-notification-close {
      border: 1px solid ButtonText;
      color: ButtonText;
    }

    .ads-notification-close:focus-visible {
      outline-color: Highlight;
    }

    .ads-notification :global(.ads-notification-progress) {
      border: 1px solid CanvasText;
      background: Canvas;
    }
  }
</style>
