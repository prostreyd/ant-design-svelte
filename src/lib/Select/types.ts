import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { PopupContainer } from '../internal/popup/types.js';
import type { SemanticStyle } from '../internal/semantic.js';

/** The identity of an option. A consumer maps ids to objects itself (the Checkbox rule). */
export type SelectValue = string | number;

/** `multiple` and `tags` take an array; `default` (the Angular name) is an alias of the single mode. */
export type SelectMode = 'multiple' | 'tags' | 'default';

/** `middle` (Vue) and `default` (Vue, Angular) are compatibility aliases of `medium`. */
export type SelectSize = 'large' | 'medium' | 'middle' | 'small' | 'default';

/** The validation look of the field. */
export type SelectStatus = 'error' | 'warning';

/** The visual variant of the field. */
export type SelectVariant = 'outlined' | 'filled' | 'borderless' | 'underlined';

/** The side of the field the list prefers; it flips at the edge of the screen. */
export type SelectPlacement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

/** One option. Other keys pass through to the callbacks (they are what `optionFilterProp` can name). */
export interface SelectOptionItem {
  /** The value; it must be unique within the Select. */
  value: SelectValue;
  /** What is drawn in the list and in the field: plain text, or a snippet. */
  label?: string | number | Snippet;
  /** The option is shown but cannot be selected. */
  disabled?: boolean;
  /** Native `title` of the option; also its text when `label` is not a string. */
  title?: string;
  /** Extra class of the option in the list. */
  class?: string;
  [key: string]: unknown;
}

/** A group of options with a label. */
export interface SelectOptionGroup {
  /** The label of the group: plain text, or a snippet. */
  label: string | number | Snippet;
  options: SelectOptionItem[];
  /** Native `title` of the group label. */
  title?: string;
  /** Extra class of the group. */
  class?: string;
  [key: string]: unknown;
}

/** An entry of `options`: a bare string or number is both the value and the label. */
export type SelectOptionData = SelectValue | SelectOptionItem | SelectOptionGroup | Record<string, unknown>;

/** Maps the keys of the objects in `options`. `groupLabel` defaults to the key of `label`. */
export interface SelectFieldNames {
  label?: string;
  value?: string;
  options?: string;
  groupLabel?: string;
}

/** The object form of `allowClear`. */
export interface SelectAllowClear {
  /** Replaces the clear icon: plain text or a snippet. */
  clearIcon?: string | Snippet;
  /** Accessible name of the clear button (default `Clear`). */
  label?: string;
  /** `tabindex` of the clear button; `-1` removes it from the Tab order (default 0). */
  tabIndex?: number;
}

/** What `tagRender` receives for one selected value of `multiple` and `tags`. */
export interface SelectTag {
  value: SelectValue;
  /** What the default tag would draw: the label of the option (or the text of the value). */
  label: string | number | Snippet;
  /** The tag can be removed: the Select is enabled and the option is not disabled. */
  closable: boolean;
  /** Removes the value, as the remove button of the default tag does. */
  onclose: () => void;
}

/** The options of `focus()`. */
export interface SelectFocusOptions {
  /** Do not scroll the field into view. */
  preventScroll?: boolean;
}

/** The named parts of a Select that `classNames` and `styles` address. `popup`, `list` and `listItem` are in the panel. */
export type SelectSemanticName =
  | 'root'
  | 'prefix'
  | 'content'
  | 'placeholder'
  | 'item'
  | 'clear'
  | 'input'
  | 'suffix'
  | 'popup'
  | 'list'
  | 'listItem';

export type SelectClassNames = Partial<Record<SelectSemanticName, string>>;
export type SelectStyles = Partial<Record<SelectSemanticName, SemanticStyle>>;

type SelectChange = SelectValue | SelectValue[] | undefined;
type SelectChangeOption = SelectOptionItem | SelectOptionItem[] | undefined;

export type SelectProps = Omit<
  HTMLAttributes<HTMLElement>,
  | 'children'
  | 'class'
  | 'style'
  | 'prefix'
  | 'role'
  | 'onchange'
  | 'onfocus'
  | 'onblur'
  | 'onkeydown'
  | 'oninput'
> & {
  /** The selected value: one value, or an array in `multiple` and `tags`. Use `bind:value`; a plain value is the initial one. */
  value?: SelectValue | SelectValue[] | null;
  /** `multiple` and `tags` take an array; in `tags` a typed text can become a value. */
  mode?: SelectMode;
  /** The options. A string or a number is both the value and the label; an object with `options` is a group. */
  options?: ReadonlyArray<SelectOptionData>;
  /** Maps the keys of the objects in `options`. */
  fieldNames?: SelectFieldNames;
  /** Shown while nothing is selected. It does not name the field. */
  placeholder?: string | Snippet;
  /** Not focusable, does not open. */
  disabled?: boolean;
  /** A spinner replaces the arrow. The list stays usable. */
  loading?: boolean;
  /** Size of the field. `middle` and `default` are compatibility aliases of `medium`. */
  size?: SelectSize;
  /** Visual variant. */
  variant?: SelectVariant;
  /** Validation look; `error` also sets `aria-invalid`. */
  status?: SelectStatus;
  /** Content before the selection, inside the field. */
  prefix?: string | Snippet;
  /** Replaces the arrow; `null` hides it. */
  suffix?: string | Snippet | null;
  /** Shows a clear button while there is a selection; the object form tunes the button. */
  allowClear?: boolean | SelectAllowClear;
  /** The remove icon of a tag. */
  removeIcon?: string | Snippet;
  /** The mark on a selected option in the list. */
  menuItemSelectedIcon?: string | Snippet;
  /** The icon shown while `loading`. */
  loadingIcon?: string | Snippet;
  /** The focused element is a text field that filters the list. Default: `false`, and `true` in `multiple` and `tags`. */
  showSearch?: boolean;
  /** The current search text. Use `bind:searchValue`. */
  searchValue?: string;
  /** Called on every change of the search text. */
  onsearch?: (value: string) => void;
  /** `true` filters by `optionFilterProp`, a function decides per option, `false` leaves the list as given. */
  filterOption?: boolean | ((input: string, option: SelectOptionItem) => boolean);
  /** Orders the filtered options. */
  filterSort?: (a: SelectOptionItem, b: SelectOptionItem, info: { searchValue: string }) => number;
  /** The fields of an option that the search text is matched against (default `label`). */
  optionFilterProp?: string | string[];
  /** `multiple` and `tags`: clear the search text after a selection. */
  autoClearSearchValue?: boolean;
  /** `multiple` and `tags`: show this many tags, the rest collapse into one. */
  maxTagCount?: number;
  /** Content of the collapsed tag. */
  maxTagPlaceholder?: string | Snippet<[omitted: SelectOptionItem[]]>;
  /** Tag text longer than this is cut with an ellipsis. */
  maxTagTextLength?: number;
  /** `multiple` and `tags`: at most this many values. */
  maxCount?: number;
  /** `multiple` and `tags`: typed or pasted text is split at these characters into values. */
  tokenSeparators?: string[];
  /** Custom tag. */
  tagRender?: Snippet<[tag: SelectTag]>;
  /** Custom content of an option in the list. */
  optionRender?: Snippet<[option: SelectOptionItem, index: number]>;
  /** Custom content of the selected value in the field. */
  labelRender?: Snippet<[option: SelectOptionItem]>;
  /** Shown in the panel when no option matches. */
  notFoundContent?: string | Snippet;
  /** The text of the line that announces the number of matches while searching. */
  resultsText?: (count: number) => string;
  /** The list is shown. Use `bind:open` for controlled use. */
  open?: boolean;
  /** Called once per change of the open state caused by the user. */
  onopenchange?: (open: boolean) => void;
  /** The preferred side of the list. */
  placement?: SelectPlacement;
  /** `true`: the list is at least as wide as the field. A number: that width in px, never narrower than the field. `false`: as wide as its content. */
  popupMatchSelectWidth?: boolean | number;
  /** Maximum height of the list in px; it scrolls beyond that. */
  listHeight?: number;
  /** Where the panel is put: an element, or a function that gets the field and returns one. Default `document.body`. */
  container?: PopupContainer;
  /** Wraps the list with custom content. */
  popupRender?: Snippet<[list: Snippet]>;
  /** Highlight the first option when the list opens or the filter changes. */
  defaultActiveFirstOption?: boolean;
  /** Called once per user change, with the new value and the option object(s). */
  onchange?: (value: SelectChange, option: SelectChangeOption) => void;
  /** A value was selected. */
  onselect?: (value: SelectValue, option: SelectOptionItem) => void;
  /** `multiple` and `tags`: a value was removed. */
  ondeselect?: (value: SelectValue, option: SelectOptionItem) => void;
  /** The clear button emptied the value (after `onchange`). */
  onclear?: () => void;
  /** Focus entered the field. Moving it between the field and its own panel does not count. */
  onfocus?: (event: FocusEvent) => void;
  /** Focus left the field. */
  onblur?: (event: FocusEvent) => void;
  /** The list scrolled. */
  onpopupscroll?: (event: Event) => void;
  /** A key went down in the focused element. */
  oninputkeydown?: (event: KeyboardEvent) => void;
  /** Native handlers of the focused element. */
  onkeydown?: HTMLAttributes<HTMLElement>['onkeydown'];
  oninput?: HTMLAttributes<HTMLElement>['oninput'];
  /** `autocomplete` of the search input (default `new-password`, so browsers do not offer saved values). */
  autocomplete?: HTMLInputAttributes['autocomplete'];
  /** `SelectOption` and `SelectOptGroup` as children; ignored when `options` has entries. */
  children?: Snippet;
  /** Extra classes for the parts. */
  classNames?: SelectClassNames;
  /** Inline styles for the parts. */
  styles?: SelectStyles;
  /** Additional CSS class appended to the root classes. */
  class?: string;
  /** Inline style of the root; `styles.root` is applied after it. */
  style?: string;
};

/** The props of `SelectOption`, written as a child of `Select` or `SelectOptGroup`. */
export interface SelectOptionProps {
  value: SelectValue;
  label?: string | number | Snippet;
  disabled?: boolean;
  title?: string;
  class?: string;
  /** The content of the item in the list. When `label` is given too, this is drawn and `label` is still the text. */
  children?: Snippet;
}

/** The props of `SelectOptGroup`. */
export interface SelectOptGroupProps {
  label: string | number | Snippet;
  title?: string;
  class?: string;
  /** The `SelectOption`s of the group. */
  children: Snippet;
}
