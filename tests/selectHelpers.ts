// Helpers shared by the Select tests.
import { screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';

export const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta' }
];

export const named = { 'aria-label': 'Letters' };

export const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

/** The focused element of the field: a `<div>` or, with search, an `<input>`. */
export const combobox = () => screen.getByRole('combobox') as HTMLElement;
/** The outermost element of the field. */
export const root = () => combobox().closest('.ads-select') as HTMLElement;
export const part = (name: string) => root().querySelector(`.ads-select-${name}`) as HTMLElement | null;
/** The open list, or `null` while the list is not shown. */
export const listbox = () => screen.queryByRole('listbox') as HTMLElement | null;
export const options = () => screen.queryAllByRole('option') as HTMLElement[];
export const optionTexts = () => options().map((option) => option.textContent?.trim());
export const optionNamed = (name: string) => options().find((option) => option.textContent?.trim() === name) as HTMLElement;
export const activeOption = () => options().find((option) => option.classList.contains('ads-select-option-active'));
/** The panel that holds the list: the element the popup moves into the container. */
export const panel = () => document.querySelector('.ads-popup') as HTMLElement | null;
export const tagTexts = () => [...root().querySelectorAll('.ads-select-tag-text')].map((tag) => tag.textContent?.trim());
export const removeButtons = () => [...root().querySelectorAll('.ads-select-tag-remove')] as HTMLButtonElement[];
export const clearButton = () => part('clear') as HTMLButtonElement | null;
export const parentValue = () => screen.getByTestId('parent-value').textContent;
export const parentOpen = () => screen.getByTestId('parent-open').textContent;
export const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));
/** The component's own classes; Svelte adds a generated scoping class that tests ignore. */
export const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
