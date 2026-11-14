/**
 * The trigger helper of the popup (specs/popup.md, R8): opens and closes a popup from hover, focus, click
 * or the context menu of its anchor, with delays and a hover bridge so the pointer can cross the gap to
 * the panel (a Popover holds links and buttons). It is an attachment for the anchor element.
 *
 * It does not own the open state: it asks for the new state through `setOpen`.
 */
import type { Attachment } from 'svelte/attachments';
import type { PopupPoint, PopupSource, PopupTrigger } from './types.js';

export interface PopupTriggerOptions {
  /** Any combination; an empty list means the popup is only controlled. */
  trigger: ReadonlyArray<PopupTrigger>;
  /** The current open state. */
  open: () => boolean;
  /** Asks for a new open state. */
  setOpen: (open: boolean, info: { source: PopupSource }) => void;
  /** Delay before the popup shows on hover, in seconds. React default 0.1. */
  mouseEnterDelay?: number;
  /** Delay before the popup hides after the pointer left, in seconds. React default 0.1. */
  mouseLeaveDelay?: number;
  /** The panel, for the hover bridge and for focus moving into it. */
  panel?: () => HTMLElement | null;
  /** Called with the pointer position when the context menu asks to open the popup. */
  onpoint?: (point: PopupPoint) => void;
  disabled?: boolean;
}

/** How long after a touch the mouse events are the compatibility events of that touch, in milliseconds. */
const TOUCH_COMPAT_MS = 800;

export function popupTriggers(options: PopupTriggerOptions): Attachment<HTMLElement> {
  return (anchor) => {
    if (options.disabled || options.trigger.length === 0) return;
    const has = (trigger: PopupTrigger) => options.trigger.includes(trigger);
    const enterDelay = (options.mouseEnterDelay ?? 0.1) * 1000;
    const leaveDelay = (options.mouseLeaveDelay ?? 0.1) * 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bound = new Set<HTMLElement>();

    const clear = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const request = (open: boolean, delay: number) => {
      clear();
      const apply = () => {
        timer = undefined;
        if (options.open() !== open) options.setOpen(open, { source: 'trigger' });
      };
      if (delay <= 0) apply();
      else timer = setTimeout(apply, delay);
    };

    const enter = () => request(true, enterDelay);
    const leave = () => request(false, leaveDelay);
    // The pointer is on the panel: keep it open. It left the panel: close, unless it went back to the anchor.
    const enterPanel = () => clear();
    const leavePanel = () => leave();

    /** The panel exists only after the first opening, so its listeners are added when it is first needed. */
    const bindPanel = () => {
      const panel = options.panel?.();
      if (!panel || bound.has(panel)) return;
      bound.add(panel);
      panel.addEventListener('mouseenter', enterPanel);
      panel.addEventListener('mouseleave', leavePanel);
    };

    // A finger has no "leaving". After a tap the browser sends compatibility mouse events (`mouseenter`, then at once
    // `mouseleave`), and the second one would close what the first one opened. The tip of a tap stays until a tap
    // somewhere else, or `Escape`, or the focus leaving (the popup closes it on an outside tap).
    let touchedAt = -Infinity;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') touchedAt = performance.now();
    };
    const afterTouch = () => performance.now() - touchedAt < TOUCH_COMPAT_MS;

    const onMouseEnter = () => {
      bindPanel();
      enter();
    };
    const onMouseLeave = () => {
      bindPanel();
      if (afterTouch()) return;
      leave();
    };
    const onFocusIn = () => request(true, 0);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      // Focus moving into the panel (a link in a Popover) keeps it open.
      if (next instanceof Node && options.panel?.()?.contains(next)) return;
      request(false, 0);
    };
    const onClick = () => request(!options.open(), 0);
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      options.onpoint?.({ x: event.clientX, y: event.clientY });
      request(true, 0);
    };

    const listeners: Array<[string, EventListener]> = [];
    const add = (type: string, listener: EventListener) => {
      anchor.addEventListener(type, listener);
      listeners.push([type, listener]);
    };
    if (has('hover')) {
      add('pointerdown', onPointerDown as EventListener);
      add('mouseenter', onMouseEnter);
      add('mouseleave', onMouseLeave);
    }
    if (has('focus')) {
      add('focusin', onFocusIn as EventListener);
      add('focusout', onFocusOut as EventListener);
    }
    if (has('click')) add('click', onClick);
    if (has('contextMenu')) add('contextmenu', onContextMenu as EventListener);

    return () => {
      clear();
      for (const [type, listener] of listeners) anchor.removeEventListener(type, listener);
      for (const panel of bound) {
        panel.removeEventListener('mouseenter', enterPanel);
        panel.removeEventListener('mouseleave', leavePanel);
      }
      bound.clear();
    };
  };
}
