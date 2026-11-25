/**
 * Whether the code runs inside a Svelte effect or a template expression. A DOM event that the browser fires while an `{#if}` takes
 * nodes out of the page (the `focusout` of the focused node) runs inside one, and state must not be written there.
 */
export const insideReaction = (): boolean => $effect.tracking();
