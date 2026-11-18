import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type Button from '../Button/Button.svelte';
import type { ButtonType } from '../Button/types.js';
import type { SemanticStyle } from '../internal/semantic.js';

/** The props of a button of the footer: the props of `Button` itself (specs/modal.md, rule 6b). */
export type ModalButtonProps = ComponentProps<typeof Button>;

/** The thirteen named parts that `classNames` and `styles` address. The last three exist in a static dialog. */
export const MODAL_PARTS = [
  'root',
  'mask',
  'wrapper',
  'dialog',
  'content',
  'close',
  'header',
  'title',
  'body',
  'footer',
  'confirmBody',
  'icon',
  'description'
] as const;

export type ModalPart = (typeof MODAL_PARTS)[number];

export type ModalClassNames = Partial<Record<ModalPart, string>>;
export type ModalStyles = Partial<Record<ModalPart, SemanticStyle>>;

/** A text, or the content of one. `0` is shown. */
export type ModalText = string | number | Snippet;

/** What the render form of `footer` is given: both buttons in their place, or each one to place by itself. */
export interface ModalFooterContext {
  origin: Snippet;
  ok: Snippet;
  cancel: Snippet;
}

/** `undefined`: the two buttons. `null`: no footer. A text. A snippet that gets the buttons. */
export type ModalFooter = string | number | Snippet<[ModalFooterContext]> | null;

export interface ModalClosable {
  /** Replaces the cross. */
  closeIcon?: Snippet;
  /** The button is shown, and does nothing. */
  disabled?: boolean;
  /** The accessible name of the button. Default `Close`. */
  'aria-label'?: string;
}

export interface ModalMask {
  /** `false` draws no mask: the Modal is modal all the same. Default `true`. */
  enabled?: boolean;
  /** A press on the mask asks the Modal to close. Default `true`. */
  closable?: boolean;
}

export interface ModalFocusable {
  /** Tab and Shift+Tab stay inside. Default `true`. */
  trap?: boolean;
  /** Focus goes back to what had it before the Modal opened. Default `true`. */
  focusTriggerAfterClose?: boolean;
  /** The button that gets focus on open: `'ok'`, `'cancel'`, or `null` for the dialog itself. Default: the first element Tab reaches. */
  autoFocusButton?: 'ok' | 'cancel' | null;
}

/** An element, a function that returns one, a selector, or `false` to leave the Modal where it is written. */
export type ModalContainer = HTMLElement | (() => HTMLElement) | string | false;

export type ModalProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style' | 'title' | 'oncancel'> & {
  /** Whether the Modal is shown. `bind:open` works: a way to close sets it to `false`. */
  open?: boolean;
  /** The title. No title, no header. */
  title?: ModalText | null;
  /** The body. */
  children?: Snippet;
  /** `undefined`: Cancel and OK. `null`: none. A text, or a snippet that gets the buttons. */
  footer?: ModalFooter;
  /** Default `OK`. */
  okText?: ModalText;
  /** Default `Cancel`. */
  cancelText?: ModalText;
  /** The `type` of the OK button. Default `primary`. */
  okType?: ButtonType;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  /** The OK button is loading. */
  confirmLoading?: boolean;
  /** The OK button was pressed. Return a Promise to make the OK button wait (with `closeOnOk`). */
  onok?: (event: MouseEvent) => unknown;
  /** The Modal closes after `onok`, waiting for a Promise it returned. Default `false`. */
  closeOnOk?: boolean;
  /** The close button, Cancel, Escape or the mask asked to close. `event.preventDefault()` keeps the Modal open. */
  oncancel?: (event: MouseEvent | KeyboardEvent) => void;
  closable?: boolean | ModalClosable;
  closeIcon?: Snippet;
  mask?: boolean | ModalMask;
  /** Escape closes. Default `true`. */
  keyboard?: boolean;
  centered?: boolean;
  /** A number is px. Default 520. */
  width?: string | number;
  zIndex?: number;
  container?: ModalContainer;
  /** The content is removed on every close. */
  destroyOnHidden?: boolean;
  /** The Modal is in the page, hidden, before the first opening. */
  forceRender?: boolean;
  focusable?: ModalFocusable;
  /** The page does not scroll while the Modal is open. Default `true`. */
  scrollLock?: boolean;
  /** Gets the card and may wrap it. */
  modalRender?: Snippet<[Snippet]>;
  class?: string;
  style?: string;
  wrapClassName?: string;
  classNames?: ModalClassNames;
  styles?: ModalStyles;
  /** After the enter or the leave animation ends. */
  onafteropenchange?: (open: boolean) => void;
  /** After the leave animation, when the Modal is gone. */
  onafterclose?: () => void;
};

/** The five static dialogs. */
export const MODAL_KINDS = ['confirm', 'info', 'success', 'warning', 'error'] as const;

export type ModalKind = (typeof MODAL_KINDS)[number];

/**
 * What a static dialog is made of (specs/modal.md, "The static family"): the options of a `Modal` that make sense for a dialog
 * that is called from code, and the content, the icon and `okCancel` of its own. The defaults differ from the `Modal`'s as in React:
 * width 416, no close button, the mask does not close it, `closeOnOk` is on, and focus goes to the OK button.
 */
export interface ModalFuncOptions {
  title?: ModalText;
  /** The text under the title. */
  content?: ModalText;
  /** A snippet or a text replaces the icon of the kind, `false` removes it. */
  icon?: Snippet | string | false;
  /** `confirm` has Cancel and OK, the others OK only; this changes that. */
  okCancel?: boolean;
  footer?: ModalFooter;
  okText?: ModalText;
  cancelText?: ModalText;
  okType?: ButtonType;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  /** A Promise it returns keeps the OK button loading: a resolve closes the dialog, a reject keeps it open. */
  onok?: (event: MouseEvent) => unknown;
  /** Called on Cancel, Escape and the other ways; a Promise it returns is waited for in the same way. `event.preventDefault()` keeps it open. */
  oncancel?: (event: MouseEvent | KeyboardEvent) => unknown;
  closable?: boolean | ModalClosable;
  closeIcon?: Snippet;
  mask?: boolean | ModalMask;
  keyboard?: boolean;
  centered?: boolean;
  width?: string | number;
  zIndex?: number;
  container?: ModalContainer;
  /** `autoFocusButton` defaults to `'ok'` here. */
  focusable?: ModalFocusable;
  scrollLock?: boolean;
  class?: string;
  style?: string;
  wrapClassName?: string;
  classNames?: ModalClassNames;
  styles?: ModalStyles;
  onafteropenchange?: (open: boolean) => void;
  onafterclose?: () => void;
}

/** What a call returns: close it, change it, or wait for it (`true` for OK, `false` for every other way to close). */
export interface ModalHandle extends PromiseLike<boolean> {
  /** Closes the dialog, with the leave animation. It resolves `false`. Does nothing if it is closed already. */
  destroy(): void;
  /** Changes the options in place: an object is merged into them, a function gets the previous ones. Does nothing after a close. */
  update(patch: ModalFuncOptions | ((previous: ModalFuncOptions) => ModalFuncOptions)): void;
}

export interface ModalApi {
  confirm(options: ModalFuncOptions): ModalHandle;
  info(options: ModalFuncOptions): ModalHandle;
  success(options: ModalFuncOptions): ModalHandle;
  warning(options: ModalFuncOptions): ModalHandle;
  error(options: ModalFuncOptions): ModalHandle;
  /** Closes every static dialog (never a `Modal` written in markup). */
  destroyAll(): void;
}
