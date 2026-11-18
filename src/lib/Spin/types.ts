import type { SemanticStyle } from '../internal/semantic.js';

/** `default` is a compatibility alias of `medium` (the Vue and Angular name). */
export type SpinSize = 'small' | 'medium' | 'large' | 'default';

/**
 * The named parts of a Spin that `classNames` and `styles` address. A standalone Spin has one
 * element for `root` and `section`; `container` exists only around embedded content.
 */
export type SpinSemanticName = 'root' | 'section' | 'indicator' | 'description' | 'container';

export type SpinClassNames = Partial<Record<SpinSemanticName, string>>;

export type SpinStyles = Partial<Record<SpinSemanticName, SemanticStyle>>;
