// Select: the search (the text input, the filter, the live regions) and the keyboard (the rows of the table of
// specs/select.md, for a field that does not search and for one that does).
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Select from '../src/lib/Select/Select.svelte';
import SelectHarness from './fixtures/SelectHarness.svelte';
import {
  AXE_OPTIONS,
  OPTIONS,
  activeOption,
  combobox,
  listbox,
  named,
  optionNamed,
  options,
  optionTexts,
  parentValue,
  part,
  root,
  text
} from './selectHelpers';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  document.querySelectorAll('.ads-popup').forEach((element) => element.remove());
});

const input = () => combobox() as HTMLInputElement;
const searching = { ...named, showSearch: true, options: OPTIONS };
const live = () => document.querySelector('.ads-select-sr') as HTMLElement;
/** Types text into the search field the way a browser reports it: one `input` event with the whole value. */
const typeText = (value: string) => fireEvent.input(input(), { target: { value } });

describe('Select search: the field', () => {
  it('showSearch: the focused element is a text input with aria-autocomplete="list"; without it a div', () => {
    const first = render(Select, { props: searching });
    expect(combobox().tagName).toBe('INPUT');
    expect(input()).toHaveAttribute('type', 'text');
    expect(input()).toHaveAttribute('aria-autocomplete', 'list');
    expect(input()).toHaveClass('ads-select-input');
    first.unmount();
    render(Select, { props: { ...named, options: OPTIONS } });
    expect(combobox().tagName).toBe('DIV');
  });

  it('the multiple and tags modes search by default, and showSearch false turns it off', () => {
    const first = render(Select, { props: { ...named, mode: 'multiple', options: OPTIONS } });
    expect(combobox().tagName).toBe('INPUT');
    first.unmount();
    const second = render(Select, { props: { ...named, mode: 'tags', options: OPTIONS } });
    expect(combobox().tagName).toBe('INPUT');
    second.unmount();
    render(Select, { props: { ...named, mode: 'multiple', showSearch: false, options: OPTIONS } });
    expect(combobox().tagName).toBe('DIV');
  });

  it('autocomplete defaults to new-password and can be set; the text is not corrected or capitalized by the browser', () => {
    const first = render(Select, { props: searching });
    expect(input()).toHaveAttribute('autocomplete', 'new-password');
    expect(input()).toHaveAttribute('autocapitalize', 'off');
    expect(input()).toHaveAttribute('spellcheck', 'false');
    first.unmount();
    render(Select, { props: { ...searching, autocomplete: 'off' } });
    expect(input()).toHaveAttribute('autocomplete', 'off');
  });

  it('the input is disabled with the field, and it takes the tabindex it is given', () => {
    const first = render(Select, { props: { ...searching, disabled: true } });
    expect(input()).toBeDisabled();
    first.unmount();
    render(Select, { props: { ...searching, tabindex: -1 } });
    expect(input()).toHaveAttribute('tabindex', '-1');
  });

  it('a press on the text only opens the list; a press on the rest of the field toggles it', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    await user.click(input());
    expect(listbox()).not.toBeNull();
    await user.click(input());
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    await user.click(part('suffix')!);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('the selected label stays under the typed text, hidden while there is text; the placeholder too', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...searching, value: 'a' } });
    expect(part('item')).not.toHaveClass('ads-select-item-hidden');
    await user.click(input());
    await typeText('be');
    expect(part('item')).toHaveClass('ads-select-item-hidden');
    expect(part('item')).toHaveTextContent('Alpha');
  });

  it('the placeholder is hidden while there is text', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...searching, placeholder: 'Pick' } });
    expect(part('placeholder')).not.toHaveClass('ads-select-placeholder-hidden');
    await user.click(input());
    await typeText('x');
    expect(part('placeholder')).toHaveClass('ads-select-placeholder-hidden');
  });

  it('the search icon takes the place of the arrow while a single field is open', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    expect(part('suffix')?.querySelector('.ads-select-icon-arrow')).not.toBeNull();
    await user.click(input());
    expect(part('suffix')?.querySelector('.ads-select-icon-search')).not.toBeNull();
    expect(part('suffix')?.querySelector('.ads-select-icon-arrow')).toBeNull();
  });

  it('the selected text is given to assistive technology through aria-describedby, after the ids of the consumer', () => {
    const first = render(Select, { props: { ...searching, value: 'a', 'aria-describedby': 'hint' } });
    const ids = input().getAttribute('aria-describedby')!.split(' ');
    expect(ids[0]).toBe('hint');
    expect(document.getElementById(ids[1])).toHaveTextContent('Alpha');
    first.unmount();
    const second = render(Select, { props: { ...searching } });
    expect(input()).not.toHaveAttribute('aria-describedby');
    second.unmount();
    render(Select, { props: { ...searching, mode: 'multiple', value: ['a', 'b'] } });
    expect(document.getElementById(input().getAttribute('aria-describedby')!)).toHaveTextContent('Alpha, Beta');
  });

  it('the field has a name for the input from a native label', () => {
    document.body.insertAdjacentHTML('beforeend', '<label for="s">Search me</label>');
    render(Select, { props: { options: OPTIONS, showSearch: true, id: 's' } });
    expect(input()).toHaveAccessibleName('Search me');
    document.querySelector('label')?.remove();
  });
});

describe('Select search: filtering', () => {
  it('typing filters the list live, case-insensitively, and the first match is highlighted', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    await user.click(input());
    await user.keyboard('A');
    expect(optionTexts()).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
    await user.keyboard('{Backspace}T');
    expect(optionTexts()).toEqual(['Beta', 'Delta']);
    expect(activeOption()).toHaveTextContent('Beta');
    expect(input()).toHaveAttribute('aria-activedescendant', options()[0].id);
  });

  it('typing into a closed field opens the list', async () => {
    const user = userEvent.setup();
    const onopenchange = vi.fn();
    render(Select, { props: { ...searching, onopenchange } });
    input().focus();
    await user.keyboard('b');
    expect(listbox()).not.toBeNull();
    expect(onopenchange).toHaveBeenCalledTimes(1);
  });

  it('with no match the panel says so, with no option listed', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    await user.click(input());
    await user.keyboard('zzz');
    expect(options()).toHaveLength(0);
    expect(document.querySelector('.ads-select-empty')).toHaveTextContent('No data');
    expect(input()).not.toHaveAttribute('aria-activedescendant');
    await user.clear(input());
    expect(options()).toHaveLength(4);
  });

  it('optionFilterProp: another field, or several; the default is the label', async () => {
    const user = userEvent.setup();
    const data = [{ value: 'a', label: 'Alpha', code: 'x1' }, { value: 'b', label: 'Beta', code: 'y2' }];
    const first = render(Select, { props: { ...named, showSearch: true, options: data, optionFilterProp: 'code' } });
    await user.click(input());
    await user.keyboard('y2');
    expect(optionTexts()).toEqual(['Beta']);
    first.unmount();
    render(Select, { props: { ...named, showSearch: true, options: data, optionFilterProp: ['label', 'code'] } });
    await user.click(input());
    await user.keyboard('x1');
    expect(optionTexts()).toEqual(['Alpha']);
    await user.clear(input());
    await user.keyboard('bet');
    expect(optionTexts()).toEqual(['Beta']);
  });

  it('filterOption: a function decides; false leaves the list as given', async () => {
    const user = userEvent.setup();
    const filterOption = vi.fn((text: string, option: { value: string }) => option.value === text);
    const first = render(Select, { props: { ...searching, filterOption: filterOption as never } });
    await user.click(input());
    await user.keyboard('d');
    expect(optionTexts()).toEqual(['Delta']);
    expect(filterOption).toHaveBeenCalledWith('d', OPTIONS[0]);
    first.unmount();
    render(Select, { props: { ...searching, filterOption: false } });
    await user.click(input());
    await user.keyboard('zzz');
    expect(optionTexts()).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
  });

  it('filterSort orders the matches', async () => {
    const user = userEvent.setup();
    const filterSort = (a: { label?: unknown }, b: { label?: unknown }) => String(b.label).localeCompare(String(a.label));
    render(Select, { props: { ...searching, filterSort } });
    await user.click(input());
    await user.keyboard('a');
    expect(optionTexts()).toEqual(['Gamma', 'Delta', 'Beta', 'Alpha']);
  });

  it('a group with no match is hidden while searching, and the group label is named for the group', async () => {
    const user = userEvent.setup();
    render(Select, {
      props: { ...named, showSearch: true, options: [{ label: 'Fruit', options: ['apple', 'pear'] }, { label: 'Veg', options: ['leek'] }] }
    });
    await user.click(input());
    expect(screen.getAllByRole('group')).toHaveLength(2);
    await user.keyboard('lee');
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(screen.getByRole('group')).toHaveAccessibleName('Veg');
  });
});

describe('Select search: the text and onsearch', () => {
  it('onsearch runs for every edit with the new text', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(Select, { props: { ...searching, onsearch } });
    await user.click(input());
    await user.keyboard('be');
    expect(onsearch.mock.calls).toEqual([['b'], ['be']]);
  });

  it('the text is cleared when the list closes (Escape, a press outside, blur) and onsearch is told', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(SelectHarness, { props: { ...searching, onsearch } });
    await user.click(input());
    await user.keyboard('be{Escape}');
    expect(input()).toHaveValue('');
    expect(onsearch).toHaveBeenLastCalledWith('');
    await user.click(input());
    await user.keyboard('al');
    await user.click(screen.getByTestId('outside'));
    expect(input()).toHaveValue('');
    await user.click(input());
    await user.keyboard('de');
    await user.tab();
    expect(input()).toHaveValue('');
    // The closed field shows the whole list again when it opens.
    await user.click(input());
    expect(options()).toHaveLength(4);
  });

  it('choosing an option in the single mode clears the text and shows the label again', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: searching });
    await user.click(input());
    await user.keyboard('del');
    await user.click(optionNamed('Delta'));
    expect(input()).toHaveValue('');
    expect(part('item')).toHaveTextContent('Delta');
    expect(part('item')).not.toHaveClass('ads-select-item-hidden');
  });

  it('searchValue: the text is held by the parent with bind:searchValue, and the list is filtered by it', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...searching, initialOpen: true, initialSearch: 'be' } });
    expect(input()).toHaveValue('be');
    expect(optionTexts()).toEqual(['Beta']);
    await user.type(input(), 't');
    expect(screen.getByTestId('parent-search')).toHaveTextContent('bet');
    await fireEvent.click(screen.getByTestId('parent-search-set'));
    expect(input()).toHaveValue('be');
  });

  it('a field that cannot search ignores searchValue', async () => {
    render(SelectHarness, { props: { ...named, options: OPTIONS, initialOpen: true, initialSearch: 'zzz' } });
    expect(optionTexts()).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
  });
});

describe('Select search: IME composition', () => {
  it('Enter during a composition does not select; the list still follows the text', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, { props: { ...searching, onchange } });
    await user.click(input());
    await fireEvent.compositionStart(input());
    await typeText('be');
    expect(optionTexts()).toEqual(['Beta']);
    await fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onchange).not.toHaveBeenCalled();
    await fireEvent.compositionEnd(input());
    await fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onchange).toHaveBeenCalledWith('b', OPTIONS[1]);
  });

  it('a key with isComposing set is ignored', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    await user.click(input());
    await fireEvent.keyDown(input(), { key: 'ArrowDown', isComposing: true });
    expect(activeOption()).toHaveTextContent('Alpha');
  });
});

describe('Select search: the announcement of the number of matches', () => {
  const settle = async () => {
    vi.advanceTimersByTime(300);
    await tick();
  };

  it('a status line says how many options match, 300 ms after the list stopped changing', async () => {
    vi.useFakeTimers();
    render(Select, { props: searching });
    await fireEvent.mouseDown(input());
    await tick();
    expect(live().textContent).toBe('');
    await typeText('t');
    await typeText('ta');
    expect(live().textContent).toBe('');
    await settle();
    expect(live()).toHaveTextContent('2 results');
    await typeText('bet');
    await settle();
    expect(live()).toHaveTextContent('1 result');
    expect(live()).not.toHaveTextContent('1 results');
  });

  it('the line is a polite, atomic live region without a status role (Orca drops a change of the text of a role="status" element)', async () => {
    vi.useFakeTimers();
    render(Select, { props: searching });
    await fireEvent.mouseDown(input());
    await tick();
    expect(live()).toHaveAttribute('aria-live', 'polite');
    expect(live()).toHaveAttribute('aria-atomic', 'true');
    expect(live()).not.toHaveAttribute('role');
    const line = live();
    await typeText('a');
    await settle();
    // The same element, with its text written in it, so that a screen reader hears a change of a live region.
    expect(live()).toBe(line);
    expect(line.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(line).toHaveTextContent('4 results');
  });

  it('resultsText makes the text', async () => {
    vi.useFakeTimers();
    render(Select, { props: { ...searching, resultsText: (count: number) => `${count} найдено` } });
    await fireEvent.mouseDown(input());
    await tick();
    await typeText('a');
    await settle();
    expect(live()).toHaveTextContent('4 найдено');
  });

  it('it is empty with no search text and once the list is closed', async () => {
    vi.useFakeTimers();
    render(Select, { props: searching });
    await fireEvent.mouseDown(input());
    await tick();
    expect(live().textContent).toBe('');
    await typeText('a');
    await settle();
    expect(live().textContent).not.toBe('');
    await fireEvent.keyDown(input(), { key: 'Tab' });
    await tick();
    expect(live().textContent).toBe('');
  });

  it('with no match it says the empty-result text instead of a number: "No data", the notFoundContent text, or the text of a snippet', async () => {
    vi.useFakeTimers();
    const first = render(Select, { props: searching });
    await fireEvent.mouseDown(input());
    await tick();
    await typeText('zzz');
    expect(live().textContent).toBe('');
    await settle();
    expect(live().textContent).toBe('No data');
    await typeText('a');
    await settle();
    expect(live().textContent).toBe('4 results');
    first.unmount();
    const second = render(Select, { props: { ...searching, notFoundContent: 'Nothing here' } });
    await fireEvent.mouseDown(input());
    await tick();
    await typeText('zzz');
    await settle();
    expect(live().textContent).toBe('Nothing here');
    second.unmount();
    render(Select, { props: { ...searching, notFoundContent: text('From a snippet') } });
    await fireEvent.mouseDown(input());
    await tick();
    await typeText('zzz');
    await settle();
    expect(live().textContent).toBe('From a snippet');
  });

  it('a list that opens empty on the first key says so too (the empty text is not a live region of its own)', async () => {
    vi.useFakeTimers();
    render(Select, { props: searching });
    input().focus();
    await typeText('zzz');
    await settle();
    expect(live().textContent).toBe('No data');
  });

  it('during an IME composition nothing is written until the composition ends', async () => {
    vi.useFakeTimers();
    render(Select, { props: searching });
    await fireEvent.mouseDown(input());
    await tick();
    await fireEvent.compositionStart(input());
    await typeText('a');
    await settle();
    expect(live().textContent).toBe('');
    await fireEvent.compositionEnd(input());
    await settle();
    expect(live()).toHaveTextContent('4 results');
  });

  it('a field that cannot search has no such line', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    expect(live()).toBeNull();
  });
});

describe('Select keyboard: a field that does not search', () => {
  const press = async (key: string, init: KeyboardEventInit = {}) => {
    await fireEvent.keyDown(combobox(), { key, ...init });
    await tick();
  };
  const field = { ...named, options: OPTIONS };

  it('ArrowDown on a closed field opens it and highlights the selected option, or the first', async () => {
    const first = render(Select, { props: field });
    combobox().focus();
    await press('ArrowDown');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Alpha');
    first.unmount();
    render(Select, { props: { ...field, value: 'd' } });
    combobox().focus();
    await press('ArrowDown');
    expect(activeOption()).toHaveTextContent('Delta');
  });

  it('ArrowDown with defaultActiveFirstOption false still highlights the first option when the key opens it', async () => {
    render(Select, { props: { ...field, defaultActiveFirstOption: false } });
    await press('ArrowDown');
    expect(activeOption()).toHaveTextContent('Alpha');
  });

  it('defaultActiveFirstOption false: a click opens with nothing highlighted, except the selected option of a single field', async () => {
    const user = userEvent.setup();
    const first = render(Select, { props: { ...field, defaultActiveFirstOption: false } });
    await user.click(combobox());
    expect(activeOption()).toBeUndefined();
    first.unmount();
    render(Select, { props: { ...field, defaultActiveFirstOption: false, value: 'b' } });
    await user.click(combobox());
    expect(activeOption()).toHaveTextContent('Beta');
  });

  it('ArrowUp on a closed field opens it with the last enabled option highlighted', async () => {
    render(Select, { props: field });
    await press('ArrowUp');
    expect(activeOption()).toHaveTextContent('Delta');
  });

  it('Alt+ArrowDown opens and changes no highlight; Alt+ArrowUp on a closed field does nothing', async () => {
    const first = render(Select, { props: field });
    await press('ArrowUp', { altKey: true });
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    await press('ArrowDown', { altKey: true });
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Alpha');
    first.unmount();
  });

  it('Alt+ArrowUp with the list open selects the highlighted option and closes', async () => {
    const onchange = vi.fn();
    render(Select, { props: { ...field, onchange } });
    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowUp', { altKey: true });
    expect(onchange).toHaveBeenCalledWith('b', OPTIONS[1]);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('Alt+ArrowUp with nothing highlighted just closes', async () => {
    const onchange = vi.fn();
    render(Select, { props: { ...field, onchange, defaultActiveFirstOption: false, options: [] } });
    await press('ArrowDown', { altKey: true });
    await press('ArrowUp', { altKey: true });
    expect(onchange).not.toHaveBeenCalled();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowDown and ArrowUp with the list open move the highlight, skip disabled options and stop at the ends', async () => {
    render(Select, { props: field });
    await press('ArrowDown');
    await press('ArrowDown');
    expect(activeOption()).toHaveTextContent('Beta');
    await press('ArrowDown');
    expect(activeOption()).toHaveTextContent('Delta');
    await press('ArrowDown');
    expect(activeOption()).toHaveTextContent('Delta');
    await press('ArrowUp');
    await press('ArrowUp');
    expect(activeOption()).toHaveTextContent('Alpha');
    await press('ArrowUp');
    expect(activeOption()).toHaveTextContent('Alpha');
    expect(combobox()).toHaveAttribute('aria-activedescendant', activeOption()!.id);
  });

  it('with no option to highlight the arrow keys do nothing and nothing throws', async () => {
    render(Select, { props: { ...named, options: [] } });
    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowUp');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toBeUndefined();
  });

  it('Enter and Space open a closed field; with the list open they select the highlighted option and close it', async () => {
    const onchange = vi.fn();
    render(Select, { props: { ...field, onchange } });
    await press('Enter');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    await press('ArrowDown');
    await press('Enter');
    expect(onchange).toHaveBeenLastCalledWith('b', OPTIONS[1]);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    await press(' ');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Beta');
    await press('ArrowDown');
    await press(' ');
    expect(onchange).toHaveBeenLastCalledWith('d', OPTIONS[3]);
  });

  it('Enter and Space with nothing highlighted select nothing', async () => {
    const onchange = vi.fn();
    render(Select, { props: { ...field, onchange, defaultActiveFirstOption: false } });
    await press('Enter');
    await press('Enter');
    expect(onchange).not.toHaveBeenCalled();
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
  });

  it('Home and End open a closed field with the first or the last option highlighted, and move the highlight when open', async () => {
    render(Select, { props: field });
    await press('End');
    expect(activeOption()).toHaveTextContent('Delta');
    await press('Home');
    expect(activeOption()).toHaveTextContent('Alpha');
    await press('Escape');
    await press('Home');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Alpha');
  });

  it('PageDown and PageUp move the highlight 10 options or to the end; on a closed field they do nothing', async () => {
    const many = Array.from({ length: 30 }, (_, index) => ({ value: index, label: `Item ${index}` }));
    render(Select, { props: { ...named, options: many } });
    await press('PageDown');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    await press('ArrowDown');
    await press('PageDown');
    expect(activeOption()).toHaveTextContent('Item 10');
    await press('PageDown');
    await press('PageDown');
    expect(activeOption()).toHaveTextContent('Item 29');
    await press('PageUp');
    expect(activeOption()).toHaveTextContent('Item 19');
  });

  it('Escape closes the list, keeps the value and keeps the focus', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...field, initial: 'a' } });
    await user.click(combobox());
    await user.keyboard('{ArrowDown}{Escape}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveFocus();
    expect(parentValue()).toBe('"a"');
  });

  it('Tab closes the list, leaves the value alone and moves the focus on', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, { props: { ...field, onchange } });
    await user.click(combobox());
    await user.keyboard('{ArrowDown}{Tab}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).not.toHaveFocus();
    expect(onchange).not.toHaveBeenCalled();
  });

  it('Tab on a closed field just moves on', async () => {
    const user = userEvent.setup();
    const onopenchange = vi.fn();
    render(Select, { props: { ...field, onopenchange } });
    await user.tab();
    await user.tab();
    expect(onopenchange).not.toHaveBeenCalled();
  });

  it('a printable character opens the list and highlights the first option that starts with it', async () => {
    render(Select, { props: { ...named, options: ['Apple', 'Apricot', 'Banana'] } });
    await press('b');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toHaveTextContent('Banana');
  });

  it('typing more characters narrows the match; the same character again cycles', async () => {
    render(Select, { props: { ...named, options: ['Apple', 'Apricot', 'Avocado', 'Banana'] } });
    await press('a');
    expect(activeOption()).toHaveTextContent('Apple');
    await press('a');
    expect(activeOption()).toHaveTextContent('Apricot');
    await press('a');
    expect(activeOption()).toHaveTextContent('Avocado');
    await press('a');
    expect(activeOption()).toHaveTextContent('Apple');
  });

  it('the typed characters are forgotten after half a second; a space in them is a character', async () => {
    vi.useFakeTimers();
    render(Select, { props: { ...named, options: ['New York', 'Newark', 'Boston'] } });
    await press('n');
    await press('e');
    await press('w');
    await press(' ');
    expect(activeOption()).toHaveTextContent('New York');
    vi.advanceTimersByTime(600);
    await press('b');
    expect(activeOption()).toHaveTextContent('Boston');
  });

  it('a character that matches nothing leaves the highlight where it is, and a disabled option is not matched', async () => {
    render(Select, { props: { ...named, options: [{ value: 1, label: 'Zebra', disabled: true }, { value: 2, label: 'Apple' }] } });
    await press('z');
    expect(activeOption()).toHaveTextContent('Apple');
  });

  it('keys with Ctrl or Meta are left to the browser', async () => {
    render(Select, { props: field });
    await press('b', { ctrlKey: true });
    await press('ArrowDown', { metaKey: true });
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('oninputkeydown and a native onkeydown see every key, also the ones the field handles', async () => {
    const oninputkeydown = vi.fn();
    const onkeydown = vi.fn();
    render(Select, { props: { ...field, oninputkeydown, onkeydown } });
    await press('ArrowDown');
    await press('x');
    expect(oninputkeydown.mock.calls.map((call) => call[0].key)).toEqual(['ArrowDown', 'x']);
    expect(onkeydown).toHaveBeenCalledTimes(2);
  });

  it('the keys that act are stopped from scrolling the page; the ones that do nothing are not', async () => {
    render(Select, { props: field });
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true });
    combobox().dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    const f5 = new KeyboardEvent('keydown', { key: 'F5', cancelable: true, bubbles: true });
    combobox().dispatchEvent(f5);
    expect(f5.defaultPrevented).toBe(false);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
    combobox().dispatchEvent(escape);
    await tick();
  });
});

describe('Select keyboard: a field that searches', () => {
  const press = async (key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init });
    input().dispatchEvent(event);
    await tick();
    return event;
  };

  it('Space types a space, Home and End move the caret: the keys are not taken', async () => {
    render(Select, { props: searching });
    input().focus();
    expect((await press(' ')).defaultPrevented).toBe(false);
    expect((await press('Home')).defaultPrevented).toBe(false);
    expect((await press('End')).defaultPrevented).toBe(false);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('Enter on a closed field does nothing and is left to the browser (a form may submit)', async () => {
    render(Select, { props: searching });
    input().focus();
    expect((await press('Enter')).defaultPrevented).toBe(false);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('Enter with the list open selects the highlighted match and closes', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, { props: { ...searching, onchange } });
    await user.click(input());
    await user.keyboard('del{Enter}');
    expect(onchange).toHaveBeenCalledWith('d', OPTIONS[3]);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowDown and ArrowUp move through the matches; ArrowDown on a closed field opens it', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    input().focus();
    await user.keyboard('{ArrowDown}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}{ArrowUp}');
    expect(activeOption()).toHaveTextContent('Alpha');
  });

  it('a printable character is typed, not used for the type-ahead', async () => {
    const user = userEvent.setup();
    render(Select, { props: searching });
    input().focus();
    await user.keyboard('d');
    expect(input()).toHaveValue('d');
    expect(optionTexts()).toEqual(['Delta']);
  });
});

describe('Select keyboard: the highlight and the pointer', () => {
  it('moving the pointer over an option highlights it; a disabled option is not highlighted; the same option is left alone', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    await user.hover(optionNamed('Delta'));
    expect(activeOption()).toHaveTextContent('Delta');
    await user.hover(optionNamed('Gamma'));
    expect(activeOption()).toHaveTextContent('Delta');
    await fireEvent.mouseMove(optionNamed('Delta'));
    expect(activeOption()).toHaveTextContent('Delta');
  });

  it('the highlighted option is scrolled into view when the arrow keys move it', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, index) => ({ value: index, label: `Item ${index}` }));
    render(Select, { props: { ...named, options: many, listHeight: 96 } });
    await user.click(combobox());
    const list = listbox()!;
    let scrollTop = 0;
    Object.defineProperty(list, 'scrollTop', { configurable: true, get: () => scrollTop, set: (next: number) => (scrollTop = next) });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 96 });
    options().forEach((option, index) => {
      Object.defineProperty(option, 'offsetTop', { configurable: true, value: index * 32 });
      Object.defineProperty(option, 'offsetHeight', { configurable: true, value: 32 });
    });
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(scrollTop).toBe(32);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(scrollTop).toBe(96);
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(scrollTop).toBe(0);
  });

  it('a highlighted option that is already in view does not scroll the list', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    const list = listbox()!;
    let scrollTop = 40;
    Object.defineProperty(list, 'scrollTop', { configurable: true, get: () => scrollTop, set: (next: number) => (scrollTop = next) });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
    options().forEach((option, index) => {
      Object.defineProperty(option, 'offsetTop', { configurable: true, value: 40 + index * 20 });
      Object.defineProperty(option, 'offsetHeight', { configurable: true, value: 20 });
    });
    await user.keyboard('{ArrowDown}');
    expect(scrollTop).toBe(40);
  });
});

describe('Select search: axe', () => {
  it('has no violations: closed, open, searching, with no match', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...searching, value: 'a' } });
    const check = async (label: string) => {
      const results = await axe.run(document.body, AXE_OPTIONS);
      expect(results.violations.map((violation) => `${label}: ${violation.id}`)).toEqual([]);
    };
    await check('closed');
    await user.click(input());
    await check('open');
    await user.keyboard('del');
    await check('searching');
    await user.keyboard('zzz');
    await check('no match');
    await tick();
    expect(root()).toHaveClass('ads-select-open');
  });

  it('a named listbox is found by axe in the multiple mode', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, mode: 'multiple', options: OPTIONS, value: ['a'] } });
    await user.click(input());
    const results = await axe.run(document.body, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
    expect(createRawSnippet).toBeDefined();
  });
});
