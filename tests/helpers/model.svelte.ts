/** A deep reactive object, what `$state({ ... })` makes in a component: the `model` of a form. */
export function reactive<T extends object>(value: T): T {
  const state = $state(value);
  return state;
}
