import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
import type Tooltip from '../Tooltip/Tooltip.svelte';
import type { SemanticStyle } from '../internal/semantic.js';

/** The color of the text. */
export const TYPOGRAPHY_TYPES = ['secondary', 'success', 'warning', 'danger'] as const;
export type TypographyType = (typeof TYPOGRAPHY_TYPES)[number];

/** `1` to `5` give `h1` to `h5`. */
export const TYPOGRAPHY_LEVELS = [1, 2, 3, 4, 5] as const;
export type TypographyLevel = (typeof TYPOGRAPHY_LEVELS)[number];

/** The named parts that `classNames` and `styles` address. */
export type TypographySemanticName = 'root' | 'actions' | 'action' | 'textarea';
export type TypographyClassNames = Partial<Record<TypographySemanticName, string>>;
export type TypographyStyles = Partial<Record<TypographySemanticName, SemanticStyle>>;

/** The props of the `Tooltip` of the ellipsis tip. `children`, `anchor` and `open` belong to the component. */
export type TypographyTooltipProps = Omit<ComponentProps<typeof Tooltip>, 'children' | 'anchor' | 'open'>;

/** The object form of `copyable`. */
export interface TypographyCopyable {
  /** The text to copy. Default: `content`, else the rendered text of the part without its actions. A function is called at each click; while its promise is awaited the button shows a spinner and starts no second request. */
  text?: string | (() => string | Promise<string>);
  /** Called once per successful copy, never after a failed one. */
  oncopy?: (event: MouseEvent | KeyboardEvent) => void;
  /** Replaces the copy and the check icons; it gets `copied`. The spinner of a promised text takes its place. */
  icon?: Snippet<[copied: boolean]>;
  /** The tip before and after the copy (default `Copy`, `Copied`); `false` hides the tip. */
  tooltips?: false | [string | Snippet, string | Snippet];
  /** `tabindex` of the button. */
  tabIndex?: number;
}

/** The object form of `editable`. */
export interface TypographyEditable {
  /** The starting text of the field, instead of `content` or the rendered text. */
  text?: string;
  /** `maxlength` of the field. */
  maxLength?: number;
  /** The field grows with the text. Default `true`. */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  /** Replaces the pencil. */
  icon?: Snippet;
  /** The tip of the edit button (default `Edit`); `false` hides it. */
  tooltip?: string | Snippet | false;
  /** The mark in the field (default the enter icon); `null` removes it. */
  enterIcon?: Snippet | null;
  /** What starts the editing: the pencil, a click on the text, or both. Default `['icon']`. */
  triggerType?: Array<'icon' | 'text'>;
  /** `tabindex` of the edit button. */
  tabIndex?: number;
  /** The user opened the field. */
  onstart?: () => void;
  /** The editing completed with a text that differs from the start. */
  onchange?: (text: string) => void;
  /** The editing completed by Enter or by blur. */
  onend?: () => void;
  /** The editing was cancelled by Esc. */
  oncancel?: () => void;
}

/** The object form of `ellipsis`. */
export interface TypographyEllipsis {
  /** Rows to show, an integer from 1 (default 1). */
  rows?: number;
  /** An expand button at the end of the last row; `'collapsible'` also collapses again. */
  expandable?: boolean | 'collapsible';
  /** Text after the cut text; always shown. */
  suffix?: string;
  /** The content of the expand button (default `Expand`, `Collapse`). */
  symbol?: string | Snippet<[expanded: boolean]>;
  /** The tip with the full text while the text is cut. */
  tooltip?: boolean | string | Snippet | TypographyTooltipProps;
  /** The user pressed expand or collapse. */
  onexpand?: (event: MouseEvent, info: { expanded: boolean }) => void;
  /** The text started or stopped being cut. */
  onellipsis?: (ellipsis: boolean) => void;
}

/** What a Text can set: one inline row, so no `rows`, `expandable` or `onexpand`. */
export type TypographyTextEllipsis = Omit<TypographyEllipsis, 'rows' | 'expandable' | 'onexpand'>;

/** The bar of buttons. */
export interface TypographyActions {
  /** Where the bar stands relative to the text. Default `end`. */
  placement?: 'start' | 'end';
}

/** The object form of `shimmer`. */
export interface TypographyShimmer {
  /** Seconds: a number is the motion time (with a 1 s wait), a pair is `[motion, wait]`. Default 1. */
  duration?: number | [number, number];
}

/** The props the four text parts share. */
export interface TypographyBaseProps {
  /** The color of the text. */
  type?: TypographyType;
  /** Disabled text color; the actions stay usable. */
  disabled?: boolean;
  /** `code` look. */
  code?: boolean;
  /** `mark` look. */
  mark?: boolean;
  /** Underlined. */
  underline?: boolean;
  /** Struck through. */
  delete?: boolean;
  /** Bold. */
  strong?: boolean;
  /** Italic. */
  italic?: boolean;
  /** `kbd` look. */
  keyboard?: boolean;
  /** The text as a value, for edit, copy and the cut. Wins over `children`. `bind:content` writes the edited text back. */
  content?: string;
  /** A copy button. */
  copyable?: boolean | TypographyCopyable;
  /** An edit button (and the text as a trigger with `triggerType`). */
  editable?: boolean | TypographyEditable;
  /** Whether the edit field is open. `bind:editing` for two-way use; a plain value is the initial state. */
  editing?: boolean;
  /** Cuts the text. */
  ellipsis?: boolean | TypographyEllipsis;
  /** Whether the cut text is expanded. `bind:expanded` for two-way use; a plain value is the initial state. */
  expanded?: boolean;
  /** The placement of the bar of buttons. */
  actions?: TypographyActions;
  /** Animated text. */
  shimmer?: boolean | TypographyShimmer;
  /** The text and the inline content. */
  children?: Snippet;
  /** Click on the part, also on its action buttons (the propagation is not stopped). */
  onclick?: (event: MouseEvent) => void;
  /** Extra classes for the `root`, `actions`, `action` and `textarea` parts. */
  classNames?: TypographyClassNames;
  /** Inline styles for the four parts; they are written after the token-based values. */
  styles?: TypographyStyles;
  /** Additional CSS class appended to the root classes. */
  class?: string;
  /** Inline style of the root; `styles.root` is applied after it. */
  style?: string;
}

type Own = 'children' | 'class' | 'style' | 'onclick';

export type TypographyProps = Omit<HTMLAttributes<HTMLElement>, Own> & {
  children?: Snippet;
  classNames?: Pick<TypographyClassNames, 'root'>;
  styles?: Pick<TypographyStyles, 'root'>;
  class?: string;
  style?: string;
};

export type TypographyTitleProps = Omit<HTMLAttributes<HTMLHeadingElement>, Own> &
  Omit<TypographyBaseProps, 'strong' | 'keyboard'> & {
    /** `1` to `5`, giving `h1` to `h5`. Default `1`. */
    level?: TypographyLevel;
  };

export type TypographyParagraphProps = Omit<HTMLAttributes<HTMLDivElement>, Own> & Omit<TypographyBaseProps, 'keyboard'>;

export type TypographyTextProps = Omit<HTMLAttributes<HTMLSpanElement>, Own> &
  Omit<TypographyBaseProps, 'ellipsis' | 'expanded'> & {
    /** `true`, or the config of a single inline row (a tip, a suffix, `onellipsis`). */
    ellipsis?: boolean | TypographyTextEllipsis;
  };

export type TypographyLinkProps = Omit<HTMLAnchorAttributes, Own> &
  Omit<TypographyBaseProps, 'ellipsis' | 'expanded'> & {
    ellipsis?: boolean | TypographyTextEllipsis;
  };
