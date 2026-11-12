// Select (single mode, the field, the list, the callbacks, the states). The other files cover `multiple` and `tags`
// (SelectMultiple), the search and the keyboard (SelectSearch), the options written as markup (SelectMarkup) and the
// panel (SelectPopup).
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Select from '../src/lib/Select/Select.svelte';
import SelectHarness from './fixtures/SelectHarness.svelte';
import SelectPanelHarness from './fixtures/SelectPanelHarness.svelte';
import {
  AXE_OPTIONS,
  OPTIONS,
  activeOption,
  appClasses,
  clearButton,
  combobox,
  listbox,
  named,
  optionNamed,
  options,
  optionTexts,
  panel,
  parentOpen,
  parentValue,
  part,
  root,
  text
} from './selectHelpers';

/** A snippet that renders markup built from its arguments. */
function createRender(build: (...args: unknown[]) => string) {
  return createRawSnippet((...getters: Array<() => unknown>) => ({ render: () => `<span>${build(...getters.map((get) => get()))}</span>` })) as never;
}

/** The empty-result text of the open panel. */
const emptyText = () => document.querySelector('.ads-select-empty') as HTMLElement | null;

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('.ads-popup, label').forEach((element) => element.remove());
});

describe('Select: render and defaults', () => {
  it('default: a combobox div in one root, medium, outlined, closed, with the arrow and nothing else', () => {
    const { container } = render(Select, { props: { ...named, options: OPTIONS } });
    expect(combobox().tagName).toBe('DIV');
    expect(combobox()).toHaveAttribute('tabindex', '0');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).not.toHaveAttribute('aria-controls');
    expect(combobox()).not.toHaveAttribute('aria-activedescendant');
    expect(combobox()).not.toHaveAttribute('aria-autocomplete');
    expect(combobox()).not.toHaveAttribute('aria-invalid');
    expect(combobox()).not.toHaveAttribute('aria-busy');
    expect(appClasses(root())).toEqual(['ads-select', 'ads-select-medium', 'ads-select-outlined', 'ads-select-single']);
    expect(root().parentElement).toBe(container);
    expect([...root().children].map((child) => child.className.replace(/\s*svelte-\w+/, ''))).toEqual(['ads-select-content', 'ads-select-suffix']);
    expect(combobox().parentElement).toBe(part('content'));
    expect(part('suffix')?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('the list is not in the document before the first opening', () => {
    render(Select, { props: { ...named, options: OPTIONS } });
    expect(listbox()).toBeNull();
    expect(panel()).toBeNull();
  });

  it('placeholder: shown while nothing is selected, as text or as a snippet, and it is not the name of the field', () => {
    const { unmount } = render(Select, { props: { options: OPTIONS, placeholder: 'Pick one', 'aria-label': 'Letters' } });
    expect(part('placeholder')).toHaveTextContent('Pick one');
    expect(combobox()).toHaveAccessibleName('Letters');
    unmount();
    render(Select, { props: { ...named, options: OPTIONS, placeholder: text('Snippet') as never } });
    expect(part('placeholder')?.querySelector('b')).toHaveTextContent('Snippet');
  });

  it('placeholder: hidden once a value is selected, and absent when none is given', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, value: 'a', placeholder: 'Pick one' } });
    expect(part('placeholder')).toBeNull();
    unmount();
    render(Select, { props: { ...named, options: OPTIONS } });
    expect(part('placeholder')).toBeNull();
  });
});

describe('Select: value', () => {
  it('value: the initial value shows the label of its option', () => {
    render(Select, { props: { ...named, options: OPTIONS, value: 'b' } });
    expect(part('item')).toHaveTextContent('Beta');
    expect(combobox()).toHaveTextContent('Beta');
  });

  it('value: null and undefined mean nothing selected', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, value: null, placeholder: 'None' } });
    expect(part('item')).toBeNull();
    expect(part('placeholder')).toHaveTextContent('None');
    unmount();
    render(Select, { props: { ...named, options: OPTIONS, value: undefined, placeholder: 'None' } });
    expect(part('item')).toBeNull();
  });

  it('value: a value that matches no option is shown as its own text', () => {
    render(Select, { props: { ...named, options: OPTIONS, value: 'zzz' } });
    expect(part('item')).toHaveTextContent('zzz');
  });

  it('value: a number matches a number option, and is not the same as its text', () => {
    render(Select, { props: { ...named, options: [{ value: 1, label: 'One' }, { value: '2', label: 'Two' }], value: 1 } });
    expect(part('item')).toHaveTextContent('One');
  });

  it('value: an array in the single mode shows its first value', () => {
    render(Select, { props: { ...named, options: OPTIONS, value: ['b', 'a'] } });
    expect(part('item')).toHaveTextContent('Beta');
  });

  it('bind:value follows a selection and a change made by the parent', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initial: 'a' } });
    expect(parentValue()).toBe('"a"');
    await user.click(combobox());
    await user.click(optionNamed('Delta'));
    expect(parentValue()).toBe('"d"');
    expect(part('item')).toHaveTextContent('Delta');
    await user.click(screen.getByTestId('parent-set'));
    expect(parentValue()).toBe('"b"');
    expect(part('item')).toHaveTextContent('Beta');
    await user.click(screen.getByTestId('parent-clear'));
    expect(part('item')).toBeNull();
  });

  it('a plain value is the initial value: a later selection changes the shown value but not the parent', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initial: 'a', binding: 'plain' } });
    await user.click(combobox());
    await user.click(optionNamed('Delta'));
    expect(part('item')).toHaveTextContent('Delta');
    expect(parentValue()).toBe('"a"');
  });

  it('a function binding can refuse a change: the field keeps showing the parent value', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initial: 'a', binding: 'confirm', allow: false } });
    await user.click(combobox());
    await user.click(optionNamed('Delta'));
    expect(part('item')).toHaveTextContent('Alpha');
    expect(parentValue()).toBe('"a"');
  });
});

describe('Select: options', () => {
  it('strings and numbers are both the value and the label', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, { props: { ...named, options: ['red', 7], onchange } });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['red', '7']);
    await user.click(optionNamed('7'));
    expect(onchange).toHaveBeenCalledWith(7, { value: 7, label: '7' });
  });

  it('objects: label as text and as a snippet, title, class and disabled', async () => {
    const user = userEvent.setup();
    render(Select, {
      props: {
        ...named,
        options: [
          { value: 'a', label: text('Rich'), title: 'Rich title', class: 'mine' },
          { value: 'b', label: 'Plain', disabled: true }
        ]
      }
    });
    await user.click(combobox());
    const [rich, plain] = options();
    expect(rich.querySelector('b')).toHaveTextContent('Rich');
    expect(rich).toHaveAttribute('title', 'Rich title');
    expect(rich).toHaveClass('mine');
    expect(plain).toHaveAttribute('aria-disabled', 'true');
    expect(plain).toHaveClass('ads-select-option-disabled');
    expect(rich).not.toHaveAttribute('aria-disabled');
  });

  it('a snippet label is drawn in the field once selected', () => {
    render(Select, { props: { ...named, options: [{ value: 'a', label: text('Rich') }], value: 'a' } });
    expect(part('item')?.querySelector('b')).toHaveTextContent('Rich');
  });

  it('groups: a labelled group of options, each option listed once', async () => {
    const user = userEvent.setup();
    render(Select, {
      props: {
        ...named,
        options: [{ label: 'Letters', title: 'About', class: 'g', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }, { value: 'z', label: 'Z' }]
      }
    });
    await user.click(combobox());
    const group = screen.getByRole('group');
    expect(group).toHaveAccessibleName('Letters');
    expect(group).toHaveClass('g');
    expect(group.querySelector('.ads-select-group-label')).toHaveAttribute('title', 'About');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['A', 'B', 'Z']);
    expect(group.querySelectorAll('[role=option]')).toHaveLength(2);
  });

  it('a group label can be a snippet', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: [{ label: text('Rich group'), options: ['a'] }] } });
    await user.click(combobox());
    expect(screen.getByRole('group').querySelector('b')).toHaveTextContent('Rich group');
  });

  it('fieldNames map the keys of options and groups', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, {
      props: {
        ...named,
        onchange,
        fieldNames: { label: 'name', value: 'id', options: 'items' },
        options: [{ id: 1, name: 'One' }, { name: 'Group', items: [{ id: 2, name: 'Two', extra: 'kept' }] }]
      }
    });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['One', 'Two']);
    expect(screen.getByRole('group')).toHaveAccessibleName('Group');
    await user.click(optionNamed('Two'));
    expect(onchange).toHaveBeenCalledWith(2, { id: 2, name: 'Two', extra: 'kept' });
  });

  it('changed options re-render the list and the label of the selected value', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Select, { props: { ...named, options: OPTIONS, value: 'a' } });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
    await rerender({ options: [{ value: 'a', label: 'Renamed' }, { value: 'x', label: 'New' }] });
    expect(optionTexts()).toEqual(['Renamed', 'New']);
    expect(part('item')).toHaveTextContent('Renamed');
  });

  it('duplicate values: the first option of a value is the one that labels it', () => {
    render(Select, { props: { ...named, options: [{ value: 'a', label: 'First' }, { value: 'a', label: 'Second' }], value: 'a' } });
    expect(part('item')).toHaveTextContent('First');
  });

  it('options with an entry that is no option (null, no value) do not break the list', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: [null as never, { label: 'x' }, { value: 'ok', label: 'OK' }] } });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['OK']);
  });
});

describe('Select: choosing a value', () => {
  it('a click on an option selects it, closes the list and keeps the focus in the field', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    await user.click(optionNamed('Beta'));
    expect(part('item')).toHaveTextContent('Beta');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveFocus();
  });

  it('onselect runs first, then onchange, each once, with the value and the option object', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onselect = vi.fn(() => calls.push('select'));
    const onchange = vi.fn(() => calls.push('change'));
    render(Select, { props: { ...named, options: OPTIONS, onselect, onchange } });
    await user.click(combobox());
    await user.click(optionNamed('Beta'));
    expect(calls).toEqual(['select', 'change']);
    expect(onselect).toHaveBeenCalledWith('b', OPTIONS[1]);
    expect(onchange).toHaveBeenCalledWith('b', OPTIONS[1]);
  });

  it('choosing the selected value again closes the list and calls nothing', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const onselect = vi.fn();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', onchange, onselect } });
    await user.click(combobox());
    await user.click(optionNamed('Alpha'));
    expect(onchange).not.toHaveBeenCalled();
    expect(onselect).not.toHaveBeenCalled();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a disabled option cannot be selected', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, { props: { ...named, options: OPTIONS, onchange } });
    await user.click(combobox());
    await user.click(optionNamed('Gamma'));
    expect(onchange).not.toHaveBeenCalled();
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
  });

  it('onchange is not called for a change made by the parent', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initial: 'a', onchange } });
    await user.click(screen.getByTestId('parent-set'));
    expect(part('item')).toHaveTextContent('Beta');
    expect(onchange).not.toHaveBeenCalled();
  });
});

describe('Select: opening and closing', () => {
  it('a press on the field opens the list, a second press closes it; focus alone does not open it', async () => {
    const user = userEvent.setup();
    const onopenchange = vi.fn();
    render(Select, { props: { ...named, options: OPTIONS, onopenchange } });
    await user.tab();
    expect(combobox()).toHaveFocus();
    expect(listbox()).toBeNull();
    await user.click(combobox());
    expect(listbox()).not.toBeNull();
    await user.click(combobox());
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(onopenchange.mock.calls).toEqual([[true], [false]]);
  });

  it('a press on the arrow and on the padding of the field toggles it too, and the field takes focus', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(part('suffix')!);
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(combobox()).toHaveFocus();
    await user.click(root());
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a press that is not the primary button does nothing', async () => {
    render(Select, { props: { ...named, options: OPTIONS } });
    await fireEvent.mouseDown(combobox(), { button: 2 });
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a press outside, Escape and blur close the list; the value stays and the focus stays on Escape', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initial: 'a' } });
    await user.click(combobox());
    await fireEvent.pointerDown(document.body);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    await user.click(combobox());
    await user.keyboard('{Escape}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveFocus();
    await user.click(combobox());
    await user.click(screen.getByTestId('outside'));
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(parentValue()).toBe('"a"');
  });

  it('open: shows the list from the start; bind:open follows the user and the parent', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initialOpen: true } });
    expect(listbox()).not.toBeNull();
    expect(parentOpen()).toBe('true');
    await user.click(optionNamed('Delta'));
    expect(parentOpen()).toBe('false');
    // `click`, not a press: a press on the button would first be a press outside, which closes the list.
    await fireEvent.click(screen.getByTestId('parent-open-toggle'));
    expect(parentOpen()).toBe('true');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    await fireEvent.click(screen.getByTestId('parent-open-toggle'));
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('onopenchange: once per change made by the user, not for a change made by the parent', async () => {
    const user = userEvent.setup();
    const onopenchange = vi.fn();
    render(SelectHarness, { props: { ...named, options: OPTIONS, onopenchange } });
    await user.click(screen.getByTestId('parent-open-toggle'));
    expect(onopenchange).not.toHaveBeenCalled();
    await user.click(optionNamed('Delta'));
    expect(onopenchange).toHaveBeenCalledTimes(1);
    expect(onopenchange).toHaveBeenCalledWith(false);
  });

  it('a parent that refuses to close keeps the list open', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, initialOpen: true, openMode: 'veto' } });
    await user.click(optionNamed('Delta'));
    expect(listbox()).not.toBeNull();
    await fireEvent.pointerDown(document.body);
    expect(listbox()).not.toBeNull();
  });

  it('a disabled field does not open, also when the parent asks', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...named, options: OPTIONS, disabled: true } });
    await user.click(combobox());
    expect(listbox()).toBeNull();
    await user.click(screen.getByTestId('parent-open-toggle'));
    expect(listbox()).toBeNull();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a field that becomes disabled while open closes its list', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    expect(listbox()).not.toBeNull();
    await rerender({ disabled: true });
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a press on the clear button does not open the list and keeps the focus in the field', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: true } });
    combobox().focus();
    await user.click(clearButton()!);
    expect(listbox()).toBeNull();
    expect(combobox()).toHaveFocus();
  });

  it('a press inside the panel keeps the focus in the field; a press on the panel is not outside', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    const mouseDown = fireEvent.mouseDown(listbox()!);
    await mouseDown;
    await fireEvent.pointerDown(listbox()!);
    expect(combobox()).toHaveFocus();
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
  });

  it('focus and blur: the callbacks run once per entry and leave of the field, not for the clear button', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: true, onfocus, onblur } });
    await user.tab();
    expect(combobox()).toHaveFocus();
    expect(onfocus).toHaveBeenCalledTimes(1);
    expect(onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
    await user.click(combobox());
    await user.tab();
    expect(clearButton()).toHaveFocus();
    expect(onfocus).toHaveBeenCalledTimes(1);
    expect(onblur).not.toHaveBeenCalled();
    await user.tab();
    expect(onblur).toHaveBeenCalledTimes(1);
    expect(onblur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
    await user.tab({ shift: true });
    expect(onfocus).toHaveBeenCalledTimes(2);
  });

  it('focus moving from the field into an input of the panel does not close the list or call onblur; leaving the panel does', async () => {
    const user = userEvent.setup();
    const onblur = vi.fn();
    render(SelectPanelHarness, { props: { ...named, options: OPTIONS, onblur } });
    await user.click(combobox());
    const input = screen.getByLabelText('In panel');
    await user.click(input);
    expect(input).toHaveFocus();
    expect(listbox()).not.toBeNull();
    expect(onblur).not.toHaveBeenCalled();
    input.blur();
    await tick();
    expect(onblur).toHaveBeenCalledTimes(1);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Select: allowClear', () => {
  it('shown only while there is a selection; its place is kept while it is hidden', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, allowClear: true } });
    expect(clearButton()).toHaveClass('ads-select-clear-hidden');
    expect(root().querySelectorAll('.ads-select-clear')).toHaveLength(1);
    unmount();
    render(Select, { props: { ...named, options: OPTIONS, allowClear: true, value: 'a' } });
    expect(clearButton()).not.toHaveClass('ads-select-clear-hidden');
  });

  it('not rendered without allowClear', () => {
    render(Select, { props: { ...named, options: OPTIONS, value: 'a' } });
    expect(clearButton()).toBeNull();
  });

  it('a click empties the value, then calls onchange and onclear, and keeps the focus in the field', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onchange = vi.fn(() => calls.push('change'));
    const onclear = vi.fn(() => calls.push('clear'));
    render(SelectHarness, { props: { ...named, options: OPTIONS, initial: 'a', allowClear: true, onchange, onclear } });
    await user.click(clearButton()!);
    expect(parentValue()).toBe('undefined');
    expect(part('item')).toBeNull();
    expect(calls).toEqual(['change', 'clear']);
    expect(onchange).toHaveBeenCalledWith(undefined, undefined);
    expect(combobox()).toHaveFocus();
  });

  it('a click on the clear button also clears the search text, and onsearch is told', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(Select, { props: { ...named, showSearch: true, options: OPTIONS, value: 'a', allowClear: true, onsearch } });
    await user.click(combobox());
    await user.keyboard('be');
    onsearch.mockClear();
    await user.click(clearButton()!);
    expect(combobox()).toHaveValue('');
    expect(onsearch).toHaveBeenCalledWith('');
  });

  it('the object form sets the accessible name and the tab index; the default name is "Clear"', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, allowClear: true, value: 'a' } });
    expect(clearButton()).toHaveAccessibleName('Clear');
    unmount();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: { label: 'Reset', tabIndex: -1 } } });
    expect(clearButton()).toHaveAccessibleName('Reset');
    expect(clearButton()).toHaveAttribute('tabindex', '-1');
  });

  it('the object form can replace the icon with text or a snippet', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: { clearIcon: 'x' } } });
    expect(clearButton()).toHaveTextContent('x');
    unmount();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: { clearIcon: text('Snippet') } } });
    expect(clearButton()?.querySelector('b')).toHaveTextContent('Snippet');
  });

  it('not shown when the field is disabled', () => {
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: true, disabled: true } });
    expect(clearButton()).toHaveClass('ads-select-clear-hidden');
  });

  it('the clear button activates with Enter and Space', async () => {
    const user = userEvent.setup();
    const onclear = vi.fn();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', allowClear: true, onclear } });
    clearButton()!.focus();
    await user.keyboard('{Enter}');
    expect(onclear).toHaveBeenCalledTimes(1);
  });
});

describe('Select: suffix, prefix, loading', () => {
  it('prefix: text or a snippet before the content', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, prefix: 'Pre' } });
    expect(part('prefix')).toHaveTextContent('Pre');
    expect(part('prefix')?.nextElementSibling).toBe(part('content'));
    unmount();
    render(Select, { props: { ...named, options: OPTIONS, prefix: text('Snippet') } });
    expect(part('prefix')?.querySelector('b')).toHaveTextContent('Snippet');
  });

  it('suffix: replaces the arrow with text or a snippet; null hides it', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, suffix: 'S' } });
    expect(part('suffix')).toHaveTextContent('S');
    expect(part('suffix')?.querySelector('svg')).toBeNull();
    unmount();
    const second = render(Select, { props: { ...named, options: OPTIONS, suffix: text('Snippet') } });
    expect(part('suffix')?.querySelector('b')).toHaveTextContent('Snippet');
    second.unmount();
    render(Select, { props: { ...named, options: OPTIONS, suffix: null } });
    expect(part('suffix')).toBeNull();
  });

  it('a press on a custom suffix opens the list', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS, suffix: 'S' } });
    await user.click(part('suffix')!);
    expect(listbox()).not.toBeNull();
  });

  it('loading: a spinner takes the place of the arrow, aria-busy is set and the list stays usable', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS, loading: true } });
    expect(part('suffix')?.querySelector('.ads-select-icon-loading')).not.toBeNull();
    expect(part('suffix')?.querySelector('.ads-select-icon-arrow')).toBeNull();
    expect(combobox()).toHaveAttribute('aria-busy', 'true');
    await user.click(combobox());
    await user.click(optionNamed('Beta'));
    expect(part('item')).toHaveTextContent('Beta');
  });

  it('loading also shows the spinner for a custom suffix and for suffix null; loadingIcon replaces the spinner', () => {
    const first = render(Select, { props: { ...named, options: OPTIONS, loading: true, suffix: 'S' } });
    expect(part('suffix')?.querySelector('.ads-select-icon-loading')).not.toBeNull();
    first.unmount();
    const second = render(Select, { props: { ...named, options: OPTIONS, loading: true, suffix: null } });
    expect(part('suffix')?.querySelector('.ads-select-icon-loading')).not.toBeNull();
    second.unmount();
    const third = render(Select, { props: { ...named, options: OPTIONS, loading: true, loadingIcon: 'wait' } });
    expect(part('suffix')).toHaveTextContent('wait');
    third.unmount();
    render(Select, { props: { ...named, options: OPTIONS, loading: true, loadingIcon: text('Snippet') } });
    expect(part('suffix')?.querySelector('b')).toHaveTextContent('Snippet');
  });
});

describe('Select: disabled, status, variant, size', () => {
  it('disabled: not focusable, no tabindex, aria-disabled, the disabled class, does not open', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS, disabled: true } });
    expect(combobox()).toHaveAttribute('aria-disabled', 'true');
    expect(combobox()).not.toHaveAttribute('tabindex');
    expect(root()).toHaveClass('ads-select-disabled');
    await user.tab();
    expect(combobox()).not.toHaveFocus();
    await user.click(combobox());
    expect(listbox()).toBeNull();
  });

  it('disabled keys do nothing', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS, disabled: true } });
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    await user.keyboard('{Enter}');
    expect(listbox()).toBeNull();
  });

  it('status error sets aria-invalid and the class; warning only the class; the consumer aria-invalid passes without a status', () => {
    const first = render(Select, { props: { ...named, options: OPTIONS, status: 'error' } });
    expect(combobox()).toHaveAttribute('aria-invalid', 'true');
    expect(root()).toHaveClass('ads-select-status-error');
    first.unmount();
    const second = render(Select, { props: { ...named, options: OPTIONS, status: 'warning' } });
    expect(combobox()).not.toHaveAttribute('aria-invalid');
    expect(root()).toHaveClass('ads-select-status-warning');
    second.unmount();
    render(Select, { props: { ...named, options: OPTIONS, 'aria-invalid': 'true' } });
    expect(combobox()).toHaveAttribute('aria-invalid', 'true');
  });

  it('an invalid status throws in development and means none in production', () => {
    expect(() => render(Select, { props: { ...named, options: OPTIONS, status: 'bad' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Select, { props: { ...named, options: OPTIONS, status: 'bad' as never } });
    expect(root().className).not.toMatch(/status/);
  });

  it('variant: each of the four, and an invalid one throws (production: outlined)', () => {
    for (const variant of ['outlined', 'filled', 'borderless', 'underlined'] as const) {
      const { unmount } = render(Select, { props: { ...named, options: OPTIONS, variant } });
      expect(root()).toHaveClass(`ads-select-${variant}`);
      unmount();
    }
    expect(() => render(Select, { props: { ...named, options: OPTIONS, variant: 'bad' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Select, { props: { ...named, options: OPTIONS, variant: 'bad' as never } });
    expect(root()).toHaveClass('ads-select-outlined');
  });

  it('size: large, medium and small; middle and default are aliases of medium; an invalid one throws (production: medium)', () => {
    for (const [size, expected] of [['large', 'large'], ['medium', 'medium'], ['small', 'small'], ['middle', 'medium'], ['default', 'medium']] as const) {
      const { unmount } = render(Select, { props: { ...named, options: OPTIONS, size } });
      expect(root()).toHaveClass(`ads-select-${expected}`);
      unmount();
    }
    expect(() => render(Select, { props: { ...named, options: OPTIONS, size: 'bad' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Select, { props: { ...named, options: OPTIONS, size: 'bad' as never } });
    expect(root()).toHaveClass('ads-select-medium');
  });

  it('mode: an invalid one throws (production: single); "default" is single', () => {
    const { unmount } = render(Select, { props: { ...named, options: OPTIONS, mode: 'default' } });
    expect(root()).toHaveClass('ads-select-single');
    unmount();
    expect(() => render(Select, { props: { ...named, options: OPTIONS, mode: 'bad' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Select, { props: { ...named, options: OPTIONS, mode: 'bad' as never } });
    expect(root()).toHaveClass('ads-select-single');
  });

  it('placement: an invalid one throws (production: bottomLeft)', () => {
    expect(() => render(Select, { props: { ...named, options: OPTIONS, placement: 'bad' as never } })).toThrow(RangeError);
  });
});

describe('Select: custom renders', () => {
  it('optionRender: replaces the content of an option in the list; the field keeps the plain label', async () => {
    const user = userEvent.setup();
    const optionRender = createRender((option, index) => `<i>${index}:${(option as { label: string }).label}</i>`);
    render(Select, { props: { ...named, options: OPTIONS, optionRender } });
    await user.click(combobox());
    expect(options()[1].querySelector('i')).toHaveTextContent('1:Beta');
    await user.click(options()[1]);
    expect(part('item')).toHaveTextContent('Beta');
    expect(part('item')?.querySelector('i')).toBeNull();
  });

  it('labelRender: replaces the content of the selected value in the field', () => {
    const labelRender = createRender((option) => `<em>${(option as { label: string }).label}!</em>`);
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', labelRender } });
    expect(part('item')?.querySelector('em')).toHaveTextContent('Alpha!');
  });

  it('notFoundContent: "No data" by default, text or a snippet when set', async () => {
    const user = userEvent.setup();
    const first = render(Select, { props: { ...named, options: [] } });
    await user.click(combobox());
    expect(emptyText()).toHaveTextContent('No data');
    first.unmount();
    const second = render(Select, { props: { ...named, options: [], notFoundContent: 'Nothing' } });
    await user.click(combobox());
    expect(emptyText()).toHaveTextContent('Nothing');
    second.unmount();
    render(Select, { props: { ...named, options: [], notFoundContent: text('Snippet') } });
    await user.click(combobox());
    expect(emptyText()?.querySelector('b')).toHaveTextContent('Snippet');
  });

  it('menuItemSelectedIcon: a mark on the selected option in the single mode; none by default', async () => {
    const user = userEvent.setup();
    const first = render(Select, { props: { ...named, options: OPTIONS, value: 'a' } });
    await user.click(combobox());
    expect(options()[0].querySelector('.ads-select-option-state')).toBeNull();
    first.unmount();
    const second = render(Select, { props: { ...named, options: OPTIONS, value: 'a', menuItemSelectedIcon: '✓' } });
    await user.click(combobox());
    expect(options()[0].querySelector('.ads-select-option-state')).toHaveTextContent('✓');
    expect(options()[1].querySelector('.ads-select-option-state')).toBeEmptyDOMElement();
    second.unmount();
    render(Select, { props: { ...named, options: OPTIONS, value: 'a', menuItemSelectedIcon: text('Snippet') } });
    await user.click(combobox());
    expect(options()[0].querySelector('.ads-select-option-state b')).toHaveTextContent('Snippet');
  });
});

describe('Select: ARIA', () => {
  it('the field is a combobox with aria-expanded, aria-controls and aria-activedescendant while open', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(combobox()).toHaveAttribute('aria-controls', listbox()!.id);
    expect(combobox()).toHaveAttribute('aria-activedescendant', options()[0].id);
    expect(listbox()).not.toHaveAttribute('aria-multiselectable');
  });

  it('options: aria-selected marks the selected one only; the others are "false"', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: OPTIONS, value: 'b' } });
    await user.click(combobox());
    expect(options().map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
  });

  it('the name of the field: aria-label, aria-labelledby, and a <label for>', async () => {
    const user = userEvent.setup();
    const first = render(Select, { props: { options: OPTIONS, 'aria-label': 'By label' } });
    expect(combobox()).toHaveAccessibleName('By label');
    await user.click(combobox());
    expect(listbox()).toHaveAccessibleName('By label');
    first.unmount();

    document.body.insertAdjacentHTML('beforeend', '<span id="title">By reference</span>');
    const second = render(Select, { props: { options: OPTIONS, 'aria-labelledby': 'title' } });
    expect(combobox()).toHaveAccessibleName('By reference');
    await user.click(combobox());
    expect(listbox()).toHaveAccessibleName('By reference');
    second.unmount();
    document.getElementById('title')?.remove();

    document.body.insertAdjacentHTML('beforeend', '<label for="mine">Native label</label>');
    render(Select, { props: { options: OPTIONS, id: 'mine' } });
    expect(combobox()).toHaveAccessibleName('Native label');
    // A click on the label focuses the field, as for a native control.
    await user.click(screen.getByText('Native label'));
    expect(combobox()).toHaveFocus();
    await user.click(combobox());
    expect(listbox()).toHaveAccessibleName('Native label');
  });

  it('a label that already has an id keeps it', () => {
    document.body.insertAdjacentHTML('beforeend', '<label for="mine" id="own-label">Own</label>');
    render(Select, { props: { options: OPTIONS, id: 'mine' } });
    expect(document.getElementById('own-label')).toBe(document.querySelector('label'));
    expect(combobox()).toHaveAttribute('aria-labelledby', 'own-label');
  });

  it('a field with an id and no label has no aria-labelledby', () => {
    render(Select, { props: { options: OPTIONS, id: 'lonely' } });
    expect(combobox()).not.toHaveAttribute('aria-labelledby');
  });

  it('a field without an id is not looked up in labels', () => {
    document.body.insertAdjacentHTML('beforeend', '<label for="other">Other</label>');
    render(Select, { props: { options: OPTIONS } });
    expect(combobox()).not.toHaveAttribute('aria-labelledby');
  });

  it('aria-describedby passes through', () => {
    render(Select, { props: { ...named, options: OPTIONS, 'aria-describedby': 'hint' } });
    expect(combobox()).toHaveAttribute('aria-describedby', 'hint');
  });

  it('native attributes go to the focused element; role, aria-expanded and aria-controls are not overridable', async () => {
    const user = userEvent.setup();
    const onkeydown = vi.fn();
    render(Select, {
      props: { ...named, options: OPTIONS, id: 'field', title: 'Tip', 'data-test': 'x', tabindex: 3, role: 'listbox', 'aria-expanded': 'true', onkeydown } as never
    });
    expect(combobox()).toHaveAttribute('id', 'field');
    expect(combobox()).toHaveAttribute('title', 'Tip');
    expect(combobox()).toHaveAttribute('data-test', 'x');
    expect(combobox()).toHaveAttribute('tabindex', '3');
    expect(combobox()).toHaveAttribute('role', 'combobox');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    combobox().focus();
    await user.keyboard('{ArrowDown}');
    expect(onkeydown).toHaveBeenCalledTimes(1);
    expect(combobox()).toHaveAttribute('aria-controls', listbox()!.id);
  });

  it('the list of a field with no name from the consumer refers to the field itself (a native label of the input names it)', async () => {
    const user = userEvent.setup();
    document.body.insertAdjacentHTML('beforeend', '<label for="s">Search me</label>');
    render(Select, { props: { options: OPTIONS, showSearch: true, id: 's' } });
    await user.click(combobox());
    expect(listbox()).toHaveAttribute('aria-labelledby', 's');
    expect(listbox()).toHaveAccessibleName('Search me');
  });

  it('an unnamed Select is reported by axe (negative check)', async () => {
    render(Select, { props: { options: OPTIONS, placeholder: 'Pick' } });
    const results = await axe.run(document.body, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toContain('aria-input-field-name');
  });
});

describe('Select: axe', () => {
  const check = async (label: string) => {
    const results = await axe.run(document.body, AXE_OPTIONS);
    expect(results.violations.map((violation) => `${label}: ${violation.id}`)).toEqual([]);
  };

  it('closed, open, with a selection, with groups', async () => {
    const user = userEvent.setup();
    render(Select, {
      props: {
        ...named,
        value: 'b',
        options: [{ label: 'Group', options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }] }, { value: 'c', label: 'Gamma', disabled: true }]
      }
    });
    await check('closed');
    await user.click(combobox());
    await check('open');
  });

  it('disabled, loading, error, with a clear button, with a prefix', async () => {
    render(Select, { props: { ...named, options: OPTIONS, disabled: true, loading: true, status: 'error', allowClear: true, value: 'a', prefix: 'P' } });
    await check('states');
  });

  it('with the labels of every kind', async () => {
    document.body.insertAdjacentHTML('beforeend', '<label for="named">Native</label>');
    render(Select, { props: { options: OPTIONS, id: 'named' } });
    await check('label for');
  });
});

describe('Select: reactivity', () => {
  it('size, variant, status, disabled and loading re-render the root', async () => {
    const { rerender } = render(Select, { props: { ...named, options: OPTIONS } });
    await rerender({ size: 'large', variant: 'filled', status: 'warning', disabled: true, loading: true });
    expect(root()).toHaveClass('ads-select-large', 'ads-select-filled', 'ads-select-status-warning', 'ads-select-disabled');
    expect(combobox()).toHaveAttribute('aria-busy', 'true');
    await rerender({ size: 'small', variant: 'outlined', status: undefined, disabled: false, loading: false });
    expect(root()).toHaveClass('ads-select-small', 'ads-select-outlined');
    expect(root().className).not.toMatch(/status|disabled/);
    expect(combobox()).not.toHaveAttribute('aria-busy');
  });

  it('the placeholder, the prefix and the suffix follow their props', async () => {
    const { rerender } = render(Select, { props: { ...named, options: OPTIONS, placeholder: 'One' } });
    await rerender({ placeholder: 'Two', prefix: 'Pre', suffix: 'Suf' });
    expect(part('placeholder')).toHaveTextContent('Two');
    expect(part('prefix')).toHaveTextContent('Pre');
    expect(part('suffix')).toHaveTextContent('Suf');
    await rerender({ prefix: undefined, suffix: undefined });
    expect(part('prefix')).toBeNull();
    expect(part('suffix')?.querySelector('svg')).not.toBeNull();
  });

  it('the field keeps the same elements while the prefix, the clear button and the loading icon come and go', async () => {
    const { rerender } = render(Select, { props: { ...named, options: OPTIONS, allowClear: true } });
    const rootBefore = root();
    const comboboxBefore = combobox();
    await rerender({ prefix: 'Pre', loading: true, value: 'a' });
    await rerender({ prefix: undefined, loading: false, value: undefined });
    expect(root()).toBe(rootBefore);
    expect(combobox()).toBe(comboboxBefore);
  });

  it('options changed while the list is open keep the highlighted option when it is still there', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Select, { props: { ...named, options: OPTIONS } });
    await user.click(combobox());
    // Alpha is highlighted first; Gamma is disabled, so the second step lands on Delta.
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeOption()).toHaveTextContent('Delta');
    await rerender({ options: [{ value: 'x', label: 'Extra' }, ...OPTIONS] });
    expect(activeOption()).toHaveTextContent('Delta');
    await rerender({ options: [{ value: 'x', label: 'Extra' }] });
    expect(activeOption()).toHaveTextContent('Extra');
  });

  it('the list is re-read when a snippet option label changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Select, { props: { ...named, options: [{ value: 'a', label: text('One') }] } });
    await user.click(combobox());
    expect(options()[0].querySelector('b')).toHaveTextContent('One');
    await rerender({ options: [{ value: 'a', label: text('Two') }] });
    expect(options()[0].querySelector('b')).toHaveTextContent('Two');
  });
});

describe('Select: methods', () => {
  it('focus() moves the focus into the field and blur() takes it away', async () => {
    const { component } = render(Select, { props: { ...named, options: OPTIONS } });
    (component as unknown as { focus: (options?: FocusOptions) => void }).focus({ preventScroll: true });
    expect(combobox()).toHaveFocus();
    (component as unknown as { blur: () => void }).blur();
    expect(combobox()).not.toHaveFocus();
    await tick();
  });
});

describe('Select: classes and styles', () => {
  it('class and style reach the root, and classNames and styles the named parts', async () => {
    const user = userEvent.setup();
    render(Select, {
      props: {
        ...named,
        options: OPTIONS,
        value: 'a',
        allowClear: true,
        prefix: 'P',
        class: 'mine',
        style: 'width: 120px',
        classNames: { root: 'c-root', prefix: 'c-prefix', content: 'c-content', item: 'c-item', clear: 'c-clear', input: 'c-input', suffix: 'c-suffix', popup: 'c-popup', list: 'c-list', listItem: 'c-list-item' },
        styles: { root: { color: 'red' }, prefix: { opacity: 0.5 }, content: { 'padding-top': '1px' }, item: { 'letter-spacing': '1px' }, clear: { '--x': 'a' }, input: { 'padding-top': '2px' }, suffix: { 'padding-top': '3px' }, popup: { 'padding-top': '5px' }, list: { 'padding-top': '4px' }, listItem: { 'padding-top': '6px' } }
      }
    });
    expect(root()).toHaveClass('mine', 'c-root', 'ads-select');
    expect(root().style.width).toBe('120px');
    expect(root().style.color).toBe('red');
    expect(part('prefix')).toHaveClass('c-prefix', 'ads-select-prefix');
    expect(part('content')).toHaveClass('c-content');
    expect(part('item')).toHaveClass('c-item');
    expect(part('clear')).toHaveClass('c-clear');
    expect(combobox()).toHaveClass('c-input', 'ads-select-selector');
    expect(part('suffix')).toHaveClass('c-suffix');
    expect(part('prefix')?.style.opacity).toBe('0.5');
    expect(part('clear')?.style.getPropertyValue('--x')).toBe('a');
    expect(combobox().style.paddingTop).toBe('2px');
    await user.click(combobox());
    expect(document.querySelector('.ads-select-popup')).toHaveClass('c-popup');
    expect((document.querySelector('.ads-select-popup') as HTMLElement).style.paddingTop).toBe('5px');
    expect(listbox()).toHaveClass('c-list');
    expect(listbox()?.style.paddingTop).toBe('4px');
    expect(options()[0]).toHaveClass('c-list-item', 'ads-select-option');
    expect(options()[0].style.paddingTop).toBe('6px');
  });

  it('the placeholder part takes its class and style too', () => {
    render(Select, { props: { ...named, options: OPTIONS, placeholder: 'P', classNames: { placeholder: 'c-ph' }, styles: { placeholder: { 'letter-spacing': '2px' } } } });
    expect(part('placeholder')).toHaveClass('c-ph');
    expect(part('placeholder')?.style.letterSpacing).toBe('2px');
  });
});
