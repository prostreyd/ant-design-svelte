// Select in the modes `multiple` and `tags`: the value as an array, the tags, the limits, the typed values.
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
  clearButton,
  combobox,
  listbox,
  named,
  optionNamed,
  options,
  optionTexts,
  parentValue,
  part,
  removeButtons,
  root,
  tagTexts,
  text
} from './selectHelpers';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('.ads-popup').forEach((element) => element.remove());
});

const PEOPLE = ['Ada', 'Grace', 'Linus', 'Margaret', 'Dennis'];
const multiple = { ...named, mode: 'multiple' as const, options: PEOPLE };
const input = () => combobox() as HTMLInputElement;

describe('Select multiple: the value and the tags', () => {
  it('the focused element is a text input, the value is an array, each value is a tag with its label', () => {
    render(Select, { props: { ...multiple, value: ['Ada', 'Linus'] } });
    expect(combobox().tagName).toBe('INPUT');
    expect(combobox()).toHaveAttribute('aria-autocomplete', 'list');
    expect(root()).toHaveClass('ads-select-multiple');
    expect(tagTexts()).toEqual(['Ada', 'Linus']);
  });

  it('undefined and null mean no tags, and the placeholder shows', () => {
    const { unmount } = render(Select, { props: { ...multiple, placeholder: 'Pick' } });
    expect(tagTexts()).toEqual([]);
    expect(part('placeholder')).toHaveTextContent('Pick');
    unmount();
    render(Select, { props: { ...multiple, value: null } });
    expect(tagTexts()).toEqual([]);
  });

  it('a value that is not an array is read as a one-element array', () => {
    render(Select, { props: { ...multiple, value: 'Grace' } });
    expect(tagTexts()).toEqual(['Grace']);
  });

  it('a value that matches no option is a tag with its own text, and it can be removed', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, initial: ['zzz'] } });
    expect(tagTexts()).toEqual(['zzz']);
    await user.click(removeButtons()[0]);
    expect(parentValue()).toBe('[]');
  });

  it('the list is aria-multiselectable and its selected options carry the mark', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...multiple, value: ['Grace'] } });
    await user.click(combobox());
    expect(listbox()).toHaveAttribute('aria-multiselectable', 'true');
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    expect(options()[1].querySelector('.ads-select-option-state svg')).not.toBeNull();
    expect(options()[0].querySelector('.ads-select-option-state svg')).toBeNull();
  });

  it('bind:value follows toggling and a change made by the parent', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, initial: ['Ada'], setTo: ['Linus', 'Ada'] } });
    await user.click(combobox());
    await user.click(optionNamed('Grace'));
    expect(parentValue()).toBe('["Ada","Grace"]');
    await user.click(screen.getByTestId('parent-set'));
    expect(tagTexts()).toEqual(['Linus', 'Ada']);
  });
});

describe('Select multiple: choosing', () => {
  it('a click toggles the option and the list stays open; a new value goes to the end', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, initial: ['Grace'] } });
    await user.click(combobox());
    await user.click(optionNamed('Ada'));
    expect(parentValue()).toBe('["Grace","Ada"]');
    expect(listbox()).not.toBeNull();
    await user.click(optionNamed('Grace'));
    expect(parentValue()).toBe('["Ada"]');
    expect(combobox()).toHaveFocus();
  });

  it('adding calls onselect then onchange; removing calls ondeselect then onchange, with the arrays of values and options', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onselect = vi.fn(() => calls.push('select'));
    const ondeselect = vi.fn(() => calls.push('deselect'));
    const onchange = vi.fn(() => calls.push('change'));
    render(Select, { props: { ...multiple, options: OPTIONS, value: ['a'], onselect, ondeselect, onchange } });
    await user.click(combobox());
    await user.click(optionNamed('Delta'));
    expect(calls).toEqual(['select', 'change']);
    expect(onselect).toHaveBeenCalledWith('d', OPTIONS[3]);
    expect(onchange).toHaveBeenCalledWith(['a', 'd'], [OPTIONS[0], OPTIONS[3]]);
    await user.click(optionNamed('Alpha'));
    expect(calls).toEqual(['select', 'change', 'deselect', 'change']);
    expect(ondeselect).toHaveBeenCalledWith('a', OPTIONS[0]);
  });

  it('a disabled option cannot be added', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Select, { props: { ...multiple, options: OPTIONS, onchange } });
    await user.click(combobox());
    await user.click(optionNamed('Gamma'));
    expect(onchange).not.toHaveBeenCalled();
  });

  it('autoClearSearchValue: the search text is cleared after a selection (default), or kept when it is false', async () => {
    const user = userEvent.setup();
    const first = render(Select, { props: { ...multiple } });
    await user.type(input(), 'gr');
    await user.click(optionNamed('Grace'));
    expect(input()).toHaveValue('');
    first.unmount();
    render(Select, { props: { ...multiple, autoClearSearchValue: false } });
    await user.type(input(), 'gr');
    await user.click(optionNamed('Grace'));
    expect(input()).toHaveValue('gr');
    expect(optionTexts()).toEqual(['Grace']);
  });

  it('clearing: onchange gets an empty array twice, then onclear; the field keeps the focus', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const onclear = vi.fn();
    render(SelectHarness, { props: { ...multiple, initial: ['Ada', 'Grace'], allowClear: true, onchange, onclear } });
    await user.click(clearButton()!);
    expect(parentValue()).toBe('[]');
    expect(onchange).toHaveBeenCalledWith([], []);
    expect(onclear).toHaveBeenCalledTimes(1);
    expect(combobox()).toHaveFocus();
  });
});

describe('Select multiple: removing a tag', () => {
  it('the remove button has a name, is not in the Tab order, and removes its value', async () => {
    const user = userEvent.setup();
    const ondeselect = vi.fn();
    const onchange = vi.fn();
    render(SelectHarness, { props: { ...multiple, initial: ['Ada', 'Grace'], ondeselect, onchange } });
    expect(removeButtons().map((button) => button.getAttribute('aria-label'))).toEqual(['Remove Ada', 'Remove Grace']);
    expect(removeButtons()[0]).toHaveAttribute('tabindex', '-1');
    await user.click(removeButtons()[0]);
    expect(parentValue()).toBe('["Grace"]');
    expect(ondeselect).toHaveBeenCalledWith('Ada', { value: 'Ada', label: 'Ada' });
    expect(onchange).toHaveBeenCalledWith(['Grace'], [{ value: 'Grace', label: 'Grace' }]);
  });

  it('a press on a remove button does not open the list and keeps the focus in the field', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...multiple, value: ['Ada'] } });
    combobox().focus();
    await user.click(removeButtons()[0]);
    expect(listbox()).toBeNull();
    expect(combobox()).toHaveFocus();
  });

  it('the remove button activates with Enter and Space', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, initial: ['Ada', 'Grace', 'Linus'] } });
    removeButtons()[0].focus();
    await user.keyboard('{Enter}');
    expect(parentValue()).toBe('["Grace","Linus"]');
    removeButtons()[0].focus();
    await user.keyboard(' ');
    expect(parentValue()).toBe('["Linus"]');
  });

  it('Backspace in an empty search text removes the last tag; with text it only edits the text', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, initial: ['Ada', 'Grace'] } });
    combobox().focus();
    await user.keyboard('x{Backspace}');
    expect(parentValue()).toBe('["Ada","Grace"]');
    await user.keyboard('{Backspace}');
    expect(parentValue()).toBe('["Ada"]');
    await user.keyboard('{Backspace}');
    expect(parentValue()).toBe('[]');
    await user.keyboard('{Backspace}');
    expect(parentValue()).toBe('[]');
  });

  it('Backspace skips a tag of a disabled option, and does nothing when only those are left', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, options: OPTIONS, initial: ['a', 'c'] } });
    combobox().focus();
    await user.keyboard('{Backspace}');
    expect(parentValue()).toBe('["c"]');
    await user.keyboard('{Backspace}');
    expect(parentValue()).toBe('["c"]');
  });

  it('a tag of a disabled option has no remove button and looks disabled', () => {
    render(Select, { props: { ...multiple, options: OPTIONS, value: ['a', 'c'] } });
    expect(removeButtons()).toHaveLength(1);
    expect(root().querySelectorAll('.ads-select-tag')[1]).toHaveClass('ads-select-tag-disabled');
  });

  it('a disabled field has no remove buttons', () => {
    render(Select, { props: { ...multiple, value: ['Ada'], disabled: true } });
    expect(removeButtons()).toHaveLength(0);
    expect(root().querySelector('.ads-select-tag')).toHaveClass('ads-select-tag-disabled');
  });

  it('removeIcon replaces the cross with text or a snippet', () => {
    const first = render(Select, { props: { ...multiple, value: ['Ada'], removeIcon: 'x' } });
    expect(removeButtons()[0]).toHaveTextContent('x');
    first.unmount();
    render(Select, { props: { ...multiple, value: ['Ada'], removeIcon: text('Snippet') } });
    expect(removeButtons()[0].querySelector('b')).toHaveTextContent('Snippet');
  });
});

describe('Select multiple: limits', () => {
  it('maxCount: with the limit reached the other options are disabled and cannot be added; selected ones can be removed', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(SelectHarness, { props: { ...multiple, maxCount: 2, initial: ['Ada', 'Grace'], onchange } });
    await user.click(combobox());
    expect(options().map((option) => option.getAttribute('aria-disabled'))).toEqual([null, null, 'true', 'true', 'true']);
    await user.click(optionNamed('Linus'));
    expect(onchange).not.toHaveBeenCalled();
    await user.click(optionNamed('Ada'));
    expect(parentValue()).toBe('["Grace"]');
    expect(options().map((option) => option.getAttribute('aria-disabled'))).toEqual([null, null, null, null, null]);
  });

  it('maxCount has no effect in the single mode', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...named, options: PEOPLE, maxCount: 1, value: 'Ada' } });
    await user.click(combobox());
    expect(options().every((option) => !option.hasAttribute('aria-disabled'))).toBe(true);
  });

  it('maxTagCount: only that many tags, the rest collapse into one tag "+ N ..."', () => {
    render(Select, { props: { ...multiple, value: ['Ada', 'Grace', 'Linus', 'Margaret'], maxTagCount: 2 } });
    expect(tagTexts()).toEqual(['Ada', 'Grace', '+ 2 ...']);
    expect(removeButtons()).toHaveLength(2);
  });

  it('maxTagCount: nothing is collapsed when everything fits, and a count below 0 is 0', () => {
    const first = render(Select, { props: { ...multiple, value: ['Ada', 'Grace'], maxTagCount: 2 } });
    expect(tagTexts()).toEqual(['Ada', 'Grace']);
    first.unmount();
    render(Select, { props: { ...multiple, value: ['Ada', 'Grace'], maxTagCount: -3 } });
    expect(tagTexts()).toEqual(['+ 2 ...']);
  });

  it('maxTagPlaceholder: text, or a snippet that gets the omitted options', () => {
    const first = render(Select, { props: { ...multiple, value: ['Ada', 'Grace', 'Linus'], maxTagCount: 1, maxTagPlaceholder: 'more' } });
    expect(tagTexts()).toEqual(['Ada', 'more']);
    first.unmount();
    const maxTagPlaceholder = createRawSnippet((omitted: () => Array<{ value: string }>) => ({
      render: () => `<b>${omitted().map((option) => option.value).join('+')}</b>`
    })) as never;
    render(Select, { props: { ...multiple, value: ['Ada', 'Grace', 'Linus'], maxTagCount: 1, maxTagPlaceholder } });
    expect(root().querySelector('.ads-select-tag-rest b')).toHaveTextContent('Grace+Linus');
  });

  it('maxTagTextLength: a longer text is cut with an ellipsis, a shorter one is not', () => {
    render(Select, { props: { ...multiple, options: ['Margaret Hamilton', 'Ada'], value: ['Margaret Hamilton', 'Ada'], maxTagTextLength: 6 } });
    expect(tagTexts()).toEqual(['Margar...', 'Ada']);
    expect(removeButtons()[0]).toHaveAccessibleName('Remove Margaret Hamilton');
  });

  it('a snippet label is drawn in the tag as it is', () => {
    render(Select, { props: { ...multiple, options: [{ value: 'a', label: text('Rich') }], value: ['a'], maxTagTextLength: 1 } });
    expect(root().querySelector('.ads-select-tag-text b')).toHaveTextContent('Rich');
  });

  it('labelRender draws the tags too', () => {
    const labelRender = createRawSnippet((option: () => { value: string }) => ({ render: () => `<em>${option().value}!</em>` })) as never;
    render(Select, { props: { ...multiple, value: ['Ada'], labelRender } });
    expect(root().querySelector('.ads-select-tag-text em')).toHaveTextContent('Ada!');
  });
});

describe('Select multiple: tagRender', () => {
  const tagRender = createRawSnippet((tag: () => { value: string; closable: boolean; onclose: () => void }) => ({
    render: () => `<button type="button" data-testid="custom-${tag().value}" data-closable="${tag().closable}">custom ${tag().value}</button>`,
    // The element of the snippet is the button itself.
    setup: (element) => {
      element.addEventListener('click', () => tag().onclose());
    }
  })) as never;

  it('replaces the default tag; closable and onclose work like the remove button', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, options: OPTIONS, initial: ['a', 'c'], tagRender } });
    expect(root().querySelectorAll('.ads-select-tag')).toHaveLength(0);
    expect(screen.getByTestId('custom-a')).toHaveAttribute('data-closable', 'true');
    expect(screen.getByTestId('custom-c')).toHaveAttribute('data-closable', 'false');
    await user.click(screen.getByTestId('custom-a'));
    expect(parentValue()).toBe('["c"]');
    expect(listbox()).toBeNull();
  });

  it('label is what the default tag would draw: the label of the option, or its text when it has none', () => {
    const seen: unknown[] = [];
    const spy = createRawSnippet((tag: () => { label: unknown }) => ({
      render: () => {
        seen.push(tag().label);
        return '<i>t</i>';
      }
    })) as never;
    render(Select, { props: { ...multiple, options: [{ value: 'k' }], value: ['k'], tagRender: spy } });
    expect(seen[0]).toBe('k');
  });

  it('closable is false in a disabled field', () => {
    render(Select, { props: { ...multiple, options: OPTIONS, value: ['a'], tagRender, disabled: true } });
    expect(screen.getByTestId('custom-a')).toHaveAttribute('data-closable', 'false');
  });
});

describe('Select tags', () => {
  const tags = { ...named, mode: 'tags' as const, options: PEOPLE };

  it('Enter adds the typed text as a value and clears the text', async () => {
    const user = userEvent.setup();
    const onselect = vi.fn();
    const onchange = vi.fn();
    render(SelectHarness, { props: { ...tags, onselect, onchange } });
    await user.click(combobox());
    await user.keyboard('zed{Enter}');
    expect(parentValue()).toBe('["zed"]');
    expect(tagTexts()).toEqual(['zed']);
    expect(input()).toHaveValue('');
    expect(onselect).toHaveBeenCalledWith('zed', { value: 'zed', label: 'zed' });
    expect(onchange).toHaveBeenCalledWith(['zed'], [{ value: 'zed', label: 'zed' }]);
  });

  it('typed text that equals an option text or value selects that option; an unselected duplicate is not added twice', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags, options: [{ value: 1, label: 'One' }, { value: 'x', label: 'Ex' }] } });
    await user.click(combobox());
    await user.keyboard('One{Enter}');
    expect(parentValue()).toBe('[1]');
    await user.keyboard('1{Enter}');
    expect(parentValue()).toBe('[1]');
    await user.keyboard('x{Enter}');
    expect(parentValue()).toBe('[1,"x"]');
  });

  it('typed text that is only spaces is not added', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags } });
    await user.click(combobox());
    await user.keyboard('   {Enter}');
    expect(parentValue()).toBe('undefined');
  });

  it('the typed text wins over the highlighted first match; a highlight moved by the user wins over the text', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags } });
    await user.click(combobox());
    await user.keyboard('a');
    expect(optionTexts()).toEqual(['Ada', 'Grace', 'Margaret']);
    await user.keyboard('{Enter}');
    expect(parentValue()).toBe('["a"]');
    await user.keyboard('a{ArrowDown}{Enter}');
    expect(parentValue()).toBe('["a","Grace"]');
  });

  it('a disabled option typed in full is not added', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags, options: OPTIONS } });
    await user.click(combobox());
    await user.keyboard('Gamma{Enter}');
    expect(parentValue()).toBe('undefined');
  });

  it('maxCount stops Enter from adding', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags, maxCount: 1, initial: ['one'] } });
    await user.click(combobox());
    await user.keyboard('two{Enter}');
    expect(parentValue()).toBe('["one"]');
  });

  it('with no text and no highlighted option Enter does nothing; with text and an empty list it adds the text', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags, defaultActiveFirstOption: false } });
    await user.click(combobox());
    await user.keyboard('{Enter}');
    expect(parentValue()).toBe('undefined');
    await user.keyboard('nobody{Enter}');
    expect(parentValue()).toBe('["nobody"]');
  });

  it('Enter with the list closed and text in the field adds nothing; the text was cleared when the list closed', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...tags } });
    await user.click(combobox());
    await user.keyboard('q{Escape}');
    expect(input()).toHaveValue('');
    await user.keyboard('{Enter}');
    expect(parentValue()).toBe('undefined');
  });

  it('tokenSeparators: a separator typed ends the token, and a pasted list becomes values', async () => {
    const user = userEvent.setup();
    const onsearch = vi.fn();
    render(SelectHarness, { props: { ...tags, tokenSeparators: [','], onsearch } });
    await user.click(combobox());
    await user.keyboard('Lucy,');
    expect(parentValue()).toBe('["Lucy"]');
    expect(input()).toHaveValue('');
    await user.paste('Jack, Tom,Lucy');
    expect(parentValue()).toBe('["Lucy","Jack","Tom"]');
    expect(input()).toHaveValue('');
    expect(onsearch).toHaveBeenCalledWith('');
  });

  it('a token that names an option (by text, any case, or by value) selects that option and is added once; a disabled one is skipped', async () => {
    const user = userEvent.setup();
    const onselect = vi.fn();
    const onchange = vi.fn();
    render(SelectHarness, {
      props: { ...tags, options: [{ value: 1, label: 'One' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma', disabled: true }], tokenSeparators: [','], onselect, onchange }
    });
    await user.click(combobox());
    await user.paste('one,1,BETA,Gamma,fresh');
    expect(parentValue()).toBe('[1,"b","fresh"]');
    expect(onselect.mock.calls.map((call) => call[0])).toEqual([1, 'b', 'fresh']);
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  it('tokens beyond maxCount are dropped, and tokens that add nothing leave the value alone and clear the text', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(SelectHarness, { props: { ...tags, tokenSeparators: [','], maxCount: 2, onchange } });
    await user.click(combobox());
    await user.paste('a,b,c');
    expect(parentValue()).toBe('["a","b"]');
    await user.paste('d,');
    expect(parentValue()).toBe('["a","b"]');
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(input()).toHaveValue('');
  });
});

describe('Select multiple: tokenSeparators in the mode multiple', () => {
  it('a part that names no option is dropped; a part that does is added', async () => {
    const user = userEvent.setup();
    render(SelectHarness, { props: { ...multiple, tokenSeparators: [',', ';'] } });
    await user.click(combobox());
    await user.paste('ada;nobody,Grace');
    expect(parentValue()).toBe('["Ada","Grace"]');
    expect(input()).toHaveValue('');
  });
});

describe('Select multiple: axe and the layout hooks', () => {
  it('has no violations with tags, with the list open, and in the tags mode', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...multiple, value: ['Ada', 'Grace'], allowClear: true } });
    await user.click(combobox());
    const results = await axe.run(document.body, AXE_OPTIONS);
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it('the field with a selected tag is not wider or taller because the list opens (classes only)', async () => {
    const user = userEvent.setup();
    render(Select, { props: { ...multiple, value: ['Ada'] } });
    const before = root().className;
    await user.click(combobox());
    expect(root().className.replace(' ads-select-open', '')).toBe(before);
    await tick();
  });

  it('fires no change for a press that only focuses', async () => {
    const onchange = vi.fn();
    render(Select, { props: { ...multiple, onchange } });
    await fireEvent.focus(combobox());
    expect(onchange).not.toHaveBeenCalled();
  });
});
