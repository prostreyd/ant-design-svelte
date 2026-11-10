import type { SemanticStyle } from '../internal/semantic.js';

/** `default` is a compatibility alias of `medium` (the Vue and Angular name). */
export type SwitchSize = 'medium' | 'small' | 'default';

/** The named parts of a Switch that `classNames` and `styles` address. */
export type SwitchSemanticName = 'root' | 'content' | 'indicator';

export type SwitchClassNames = Partial<Record<SwitchSemanticName, string>>;

export type SwitchStyles = Partial<Record<SwitchSemanticName, SemanticStyle>>;
