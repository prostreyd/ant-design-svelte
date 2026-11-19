<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { classList, styleText } from '../internal/semantic.js';
  import { playEnter, playLeave } from '../internal/anim/motion.js';
  import MessageIcon from './MessageIcon.svelte';
  import { closeById, finalize, setPaused, type MessageRecord, type MessageSettings } from './store.js';

  /** One message: the slot it takes in the list, and the box inside it. */
  type ItemProps = {
    record: MessageRecord;
    /** Its place in the list as shown: 0 is the first row (the newest, when `stack` is on). */
    index: number;
    settings: MessageSettings;
    /** The list is a collapsed pile: the messages lie behind the first one. */
    piled: boolean;
    /** `stack` is on, so a new message pushes the others down. */
    stacked: boolean;
  };

  // The distance a message slides is the token of the Message, not a value of the shared motion.
  const MOTION = { offsetToken: '--ads-message-motion-offset' };

  let { record, index, settings, piled, stacked }: ItemProps = $props();

  let slot = $state<HTMLElement | null>(null);
  let item = $state<HTMLElement | null>(null);

  const iconName = $derived(record.type);
  const word = $derived(settings.labels[record.type]);
  // A failure interrupts a screen reader (`alert`); the rest wait for it to finish (`status`).
  const role = $derived(record.type === 'error' || record.type === 'warning' ? 'alert' : 'status');
  const closable = $derived(record.closable ?? settings.closable);
  // The older messages of a collapsed pile cannot be seen, so they cannot take focus or be read again.
  const buried = $derived(piled && index > 0);
  const depth = $derived(Math.min(index, 2));

  // Where a part gets its class or style: the message's own wins over the one of the host or `message.config()`.
  const own = $derived(record.classNames);
  const ownStyles = $derived(record.styles);
  const part = (name: 'root' | 'wrapper' | 'icon' | 'title' | 'close') => own?.[name] ?? settings.classNames[name];
  const partStyle = (name: 'root' | 'wrapper' | 'icon' | 'title' | 'close') => ownStyles?.[name] ?? settings.styles[name];

  // Comes in once. A message that was already on the page when its layer was created (the layer of the library
  // handing over to a `MessageHost`) has no motion of its own.
  onMount(() => {
    // `shift`: the first row of a stacked list pushes the ones behind it down, so its slot grows instead of jumping.
    if (slot && item && Date.now() - record.createdAt < 150) playEnter(slot, item, stacked && index === 0 && slot.nextElementSibling !== null, MOTION);
  });

  let leaving = false;
  $effect(() => {
    if (record.state !== 'closing' || leaving || !slot || !item) return;
    leaving = true;
    const id = record.id;
    const [s, i] = [slot, item];
    untrack(() => {
      void playLeave(s, i, MOTION).then(() => finalize(id));
    });
  });

  // The box is made again by an update with the same key (so that a screen reader reads it as new). A focused element
  // inside it is gone then, and no `focusout` tells; without this the timer would wait for a focus that is not there.
  $effect(() => {
    void record.revision;
    const id = untrack(() => record.id);
    if (item && !item.contains(document.activeElement)) setPaused(id, 'focus', false);
  });

  // The attribute, not the property: a browser without `inert` ignores a property it does not know. There only the
  // close button is kept out of the Tab order (its `tabindex`); links and buttons that a snippet put inside stay in it.
  function inert(node: HTMLElement): void {
    node.toggleAttribute('inert', buried);
  }

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

<div
  class="ads-message-slot"
  class:ads-message-slot-stack={stacked}
  data-message-id={`${record.id}`}
  data-depth={piled ? depth : undefined}
  style={`--ads-message-i: ${index}`}
  style:z-index={piled ? 100 - index : undefined}
  bind:this={slot}
>
  <div
    class="ads-message-item"
    class:ads-message-leaving={record.state === 'closing'}
    {@attach inert}
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
        class={classList('ads-message', `ads-message-${record.type}`, record.class, part('root'))}
        style={styleText(record.style, partStyle('root'))}
        {role}
        onclick={(event) => record.onclick?.(event)}
      >
        <span class={classList('ads-message-wrapper', part('wrapper'))} style={styleText(partStyle('wrapper'))}>
          {#if record.icon !== false}
            <span class={classList('ads-message-icon', part('icon'))} style={styleText(partStyle('icon'))} aria-hidden="true">
              {#if record.icon === undefined}
                <MessageIcon name={iconName} />
              {:else if typeof record.icon === 'function'}
                {@render record.icon()}
              {:else}
                {record.icon}
              {/if}
            </span>
          {/if}
          <span class={classList('ads-message-title', part('title'))} style={styleText(partStyle('title'))}>
            {#if word}<span class="ads-message-word">{`${word}: `}</span>{/if}
            {#if typeof record.content === 'function'}{@render record.content()}{:else}{record.content}{/if}
          </span>
        </span>
        {#if closable}
          <button
            type="button"
            class={classList('ads-message-close', part('close'))}
            style={styleText(partStyle('close'))}
            aria-label={settings.labels.close}
            tabindex={buried ? -1 : undefined}
            onclick={close}
          >
            <MessageIcon name="close" />
          </button>
        {/if}
      </div>
    {/key}
  </div>
</div>

<style>
  /* One row of the list. Its bottom padding is the gap to the next row, so that a leaving row takes the gap with it. */
  .ads-message-slot {
    box-sizing: border-box;
    max-width: 100%;
    padding-block-end: var(--ads-message-gap);
    pointer-events: none;
  }

  /* With `stack` the rows and the gaps between them count as the pile: the pointer must not fall through a gap. */
  .ads-message-slot-stack {
    pointer-events: auto;
  }

  .ads-message-item {
    max-width: 100%;
    pointer-events: none;
    transition:
      transform var(--ads-motion-duration) var(--ads-motion-ease),
      opacity var(--ads-motion-duration) var(--ads-motion-ease);
  }

  /* A message that is leaving is closed already: it stays on the page for the length of its exit, and must not take a click meant
     for what is under it, nor call its `onclick`. */
  .ads-message-leaving .ads-message {
    pointer-events: none;
  }

  /* Behind the first message of a collapsed pile: lowered, smaller, and only the first of them peeks out below. */
  :global(.ads-message-piled) .ads-message-item {
    transform-origin: bottom center;
    transform: translateY(calc(var(--ads-message-i) * var(--ads-message-stack-offset)))
      scale(calc(1 - var(--ads-message-i) * var(--ads-message-stack-scale-step)));
  }

  /* In a pile every row lies on the first one. */
  :global(.ads-message-piled) .ads-message-slot {
    grid-area: 1 / 1;
    justify-self: center;
  }

  /* The third and the rows behind it are not shown, and must not catch the pointer. */
  :global(.ads-message-piled) .ads-message-slot[data-depth='2'] {
    pointer-events: none;
  }

  :global(.ads-message-piled) .ads-message-slot[data-depth='2'] .ads-message-item {
    opacity: 0;
  }

  .ads-message {
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    gap: var(--ads-message-icon-gap);
    max-width: 100%;
    padding: var(--ads-message-padding);
    border-radius: var(--ads-message-radius);
    color: var(--ads-message-color);
    background: var(--ads-message-bg);
    box-shadow: var(--ads-message-shadow);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: var(--ads-message-line-height);
    text-align: start;
    pointer-events: auto;
  }

  .ads-message-wrapper {
    display: flex;
    flex: 1 1 auto;
    align-items: flex-start;
    gap: var(--ads-message-icon-gap);
    min-width: 0;
  }

  /* As tall as a line of text, so the box is the same height with or without an icon, whatever the icon's size. */
  .ads-message-icon {
    display: flex;
    flex: none;
    align-items: center;
    height: var(--ads-message-line-height);
  }

  .ads-message-icon :global(svg) {
    font-size: var(--ads-message-icon-size);
  }

  .ads-message-info .ads-message-icon {
    color: var(--ads-message-icon-info);
  }

  .ads-message-loading .ads-message-icon {
    color: var(--ads-message-icon-info);
  }

  .ads-message-success .ads-message-icon {
    color: var(--ads-message-icon-success);
  }

  .ads-message-error .ads-message-icon {
    color: var(--ads-message-icon-error);
  }

  .ads-message-warning .ads-message-icon {
    color: var(--ads-message-icon-warning);
  }

  .ads-message-title {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* The type, for a screen reader only. */
  .ads-message-word {
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

  .ads-message-close {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--ads-message-close-size);
    height: var(--ads-message-close-size);
    margin: calc((var(--ads-message-line-height) - var(--ads-message-close-size)) / 2) 0;
    margin-inline-start: var(--ads-message-icon-gap);
    padding: 0;
    border: 0;
    border-radius: var(--ads-radius-sm);
    color: var(--ads-message-close-color);
    background: var(--ads-message-close-bg);
    font-size: var(--ads-message-icon-size);
    cursor: pointer;
    transition:
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-message-close:hover {
    color: var(--ads-message-close-color-hover);
    background: var(--ads-message-close-bg-hover);
  }

  .ads-message-close:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-message-item,
    .ads-message-close {
      transition: none;
    }
  }

  /* The shadow and the colors are replaced by the system ones: without a border the box would melt into the page. */
  @media (forced-colors: active) {
    .ads-message {
      border: 1px solid CanvasText;
    }

    .ads-message-icon {
      color: CanvasText;
    }

    .ads-message-close {
      border: 1px solid ButtonText;
      color: ButtonText;
    }

    .ads-message-close:focus-visible {
      outline-color: Highlight;
    }
  }
</style>
