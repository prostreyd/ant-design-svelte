import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InputOTP from '../src/lib/Input/InputOTP.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
});

const named = { 'aria-label': 'Verification code' };
const group = () => screen.getByRole('group') as HTMLElement;
const cells = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const values = () => cells().map((cell) => cell.value);
const parentValue = () => screen.getByTestId('parent-value').textContent;
const focused = () => cells().indexOf(document.activeElement as HTMLInputElement);
const appClasses = (element: Element | null) =>
  [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('InputOTP', () => {
  // --- Rendering ---

  it('default: a group of six empty single-character inputs, each with its own name', () => {
    render(InputOTP, { props: named });
    expect(group()).toHaveClass('ads-input-otp');
    expect(group()).toHaveAccessibleName('Verification code');
    expect(cells()).toHaveLength(6);
    expect(values()).toEqual(['', '', '', '', '', '']);
    cells().forEach((cell, index) => {
      expect(cell).toHaveAttribute('type', 'text');
      expect(cell).toHaveAccessibleName(`Character ${index + 1} of 6`);
      expect(cell.closest('.ads-input')).toHaveClass('ads-input-medium', 'ads-input-outlined');
      expect(cell).toHaveAttribute('autocapitalize', 'off');
      expect(cell).toHaveAttribute('spellcheck', 'false');
    });
  });

  it('length: sets the number of cells and their names', () => {
    render(InputOTP, { props: { ...named, length: 4 } });
    expect(cells()).toHaveLength(4);
    expect(cells()[3]).toHaveAccessibleName('Character 4 of 4');
  });

  it('length: a value that is not a positive integer throws outside production and means six in production', () => {
    for (const length of [0, 2.5, -1, Number.NaN]) {
      expect(() => render(InputOTP, { props: { ...named, length } })).toThrow(RangeError);
    }
    vi.stubEnv('NODE_ENV', 'production');
    render(InputOTP, { props: { ...named, length: 0 } });
    expect(cells()).toHaveLength(6);
  });

  it('length: changing it later adds or removes cells', async () => {
    const { rerender } = render(InputOTP, { props: { ...named, length: 4, value: '12' } });
    await rerender({ length: 6 });
    expect(cells()).toHaveLength(6);
    expect(values().slice(0, 2)).toEqual(['1', '2']);
    await rerender({ length: 3 });
    expect(cells()).toHaveLength(3);
  });

  // --- value ---

  it('value: the initial text fills the cells from the first one; extra characters are not shown', () => {
    const { unmount } = render(InputOTP, { props: { ...named, length: 4, value: '12' } });
    expect(values()).toEqual(['1', '2', '', '']);
    unmount();
    render(InputOTP, { props: { ...named, length: 3, value: '123456' } });
    expect(values()).toEqual(['1', '2', '3']);
  });

  it('value: an emoji outside the BMP is one character', () => {
    render(InputOTP, { props: { ...named, length: 3, value: '😀a' } });
    expect(values()).toEqual(['😀', 'a', '']);
  });

  it('value: null means empty', () => {
    render(InputOTP, { props: { ...named, value: null as unknown as string } });
    expect(values()).toEqual(['', '', '', '', '', '']);
  });

  it('value: bind:value follows typing, and a change of the parent re-fills the cells', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputOTP, ...named, length: 4 } });
    await user.click(cells()[0]);
    await user.keyboard('12');
    expect(parentValue()).toBe('12');
    screen.getByTestId('parent-set').click();
    await vi.waitFor(() => expect(values()).toEqual(['f', 'r', 'o', 'm']));
  });

  it('value: a plain value={x} is the initial text and typing changes it locally', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputOTP, mode: 'plain', initial: '1', ...named, length: 4 } });
    await user.click(cells()[1]);
    await user.keyboard('2');
    expect(values()).toEqual(['1', '2', '', '']);
    expect(parentValue()).toBe('1');
  });

  it('value: a function binding that refuses an edit leaves the cells as they were', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputOTP, mode: 'confirm', allow: false, initial: '12', ...named, length: 4 } });
    await user.click(cells()[2]);
    await user.keyboard('3');
    expect(values()).toEqual(['1', '2', '', '']);
    expect(parentValue()).toBe('12');
  });

  // --- Typing ---

  it('typing: a character fills the cell and moves focus to the next one', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 4 } });
    await user.click(cells()[0]);
    await user.keyboard('1');
    expect(values()).toEqual(['1', '', '', '']);
    expect(focused()).toBe(1);
    await user.keyboard('23');
    expect(values()).toEqual(['1', '2', '3', '']);
    expect(focused()).toBe(3);
  });

  it('typing: the last cell keeps focus, and a further character replaces its character', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3 } });
    await user.click(cells()[0]);
    await user.keyboard('123');
    expect(focused()).toBe(2);
    await user.keyboard('9');
    expect(values()).toEqual(['1', '2', '9']);
  });

  it('typing: a character over a filled cell replaces it (the cell is selected on focus)', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 4, value: '1234' } });
    await user.click(cells()[1]);
    await user.keyboard('9');
    expect(values()).toEqual(['1', '9', '3', '4']);
    expect(focused()).toBe(2);
  });

  it('typing: any character is accepted, not only digits', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3 } });
    await user.click(cells()[0]);
    await user.keyboard('a-Z');
    expect(values()).toEqual(['a', '-', 'Z']);
  });

  it('typing: an emoji takes one cell', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3 } });
    await user.click(cells()[0]);
    await user.keyboard('😀');
    expect(values()).toEqual(['😀', '', '']);
  });

  it('typing: a whole code arriving in one cell (autofill) is spread over the cells', async () => {
    render(InputOTP, { props: { ...named, length: 4 } });
    const first = cells()[0];
    first.value = '1234';
    await fireEvent.input(first);
    expect(values()).toEqual(['1', '2', '3', '4']);
  });

  it('focus: a cell past the first empty one cannot be used: focus goes to the first empty cell', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 6, value: '12' } });
    await user.click(cells()[4]);
    await vi.waitFor(() => expect(focused()).toBe(2));
    await user.keyboard('3');
    expect(values().slice(0, 4)).toEqual(['1', '2', '3', '']);
  });

  it('focus: when every cell is filled any cell can be focused', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3, value: '123' } });
    await user.click(cells()[0]);
    expect(focused()).toBe(0);
    expect(cells()[0].selectionStart).toBe(0);
    expect(cells()[0].selectionEnd).toBe(1);
  });

  // --- Deleting ---

  it('Backspace: on a filled cell removes its character, the rest move left and focus stays', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 4, value: '1234' } });
    await user.click(cells()[1]);
    await user.keyboard('{Backspace}');
    expect(values()).toEqual(['1', '3', '4', '']);
    expect(focused()).toBe(1);
  });

  it('Backspace: on an empty cell removes the previous character and moves back', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 4, value: '12' } });
    await user.click(cells()[2]);
    await user.keyboard('{Backspace}');
    expect(values()).toEqual(['1', '', '', '']);
    expect(focused()).toBe(1);
  });

  it('Backspace: on the first empty cell of an empty field does nothing', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(InputOTP, { props: { ...named, length: 3, oninput } });
    await user.click(cells()[0]);
    await user.keyboard('{Backspace}');
    expect(values()).toEqual(['', '', '']);
    expect(oninput).not.toHaveBeenCalled();
    expect(focused()).toBe(0);
  });

  it('Delete: removes the character of the focused cell; an empty cell is left alone', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 4, value: '123' } });
    await user.click(cells()[0]);
    await user.keyboard('{Delete}');
    expect(values()).toEqual(['2', '3', '', '']);
    await user.click(cells()[2]);
    await vi.waitFor(() => expect(focused()).toBe(2));
    await user.keyboard('{Delete}');
    expect(values()).toEqual(['2', '3', '', '']);
  });

  // --- Arrow keys ---

  it('ArrowLeft and ArrowRight: move between the cells and stop at the ends', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3, value: '123' } });
    await user.click(cells()[0]);
    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe(0);
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe(1);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(focused()).toBe(2);
    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe(1);
  });

  it('ArrowLeft and ArrowRight: in a right-to-left cell they go the other way', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3, value: '123', styles: { input: { direction: 'rtl' } } } });
    await user.click(cells()[1]);
    await user.keyboard('{ArrowLeft}');
    expect(focused()).toBe(2);
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe(1);
  });

  // --- Paste ---

  it('paste: into the first cell fills the cells and moves focus to the end of the pasted text', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 6 } });
    await user.click(cells()[0]);
    await user.paste('1234');
    expect(values()).toEqual(['1', '2', '3', '4', '', '']);
    expect(focused()).toBe(4);
  });

  it('paste: more characters than cells are cut', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 4 } });
    await user.click(cells()[0]);
    await user.paste('123456');
    expect(values()).toEqual(['1', '2', '3', '4']);
    expect(focused()).toBe(3);
  });

  it('paste: into a later cell fills from there and replaces what follows', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 6, value: '123456' } });
    await user.click(cells()[2]);
    await user.paste('ab');
    expect(values()).toEqual(['1', '2', 'a', 'b', '5', '6']);
  });

  it('paste: the text is not typed into the cell as well', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 6 } });
    await user.click(cells()[0]);
    await user.paste('12');
    expect(cells()[0].value).toBe('1');
  });

  it('typing: a character that lands next to the one the cell showed is taken without it (prefix, suffix, or neither)', async () => {
    render(FieldHarness, { props: { component: InputOTP, initial: 'abc', ...named, length: 3 } });
    const second = () => cells()[1];
    second().value = 'bX';
    await fireEvent.input(second());
    expect(parentValue()).toBe('aXc');
    second().value = 'YX';
    await fireEvent.input(second());
    expect(parentValue()).toBe('aYc');
    second().value = 'QR';
    await fireEvent.input(second());
    expect(parentValue()).toBe('aQR');
  });

  it('typing: next to a masked cell the mask character is dropped, not taken as a character', async () => {
    render(FieldHarness, { props: { component: InputOTP, initial: 'abc', mask: '*', ...named, length: 3 } });
    const second = cells()[1];
    second.value = '*Z';
    await fireEvent.input(second);
    expect(parentValue()).toBe('aZc');
  });

  it('paste: an empty clipboard, or one with no text, changes nothing', async () => {
    const oninput = vi.fn();
    render(FieldHarness, { props: { component: InputOTP, initial: '123', ...named, length: 4, oninput } });
    await fireEvent.paste(cells()[1]);
    await fireEvent.paste(cells()[1], { clipboardData: { getData: () => '' } });
    expect(parentValue()).toBe('123');
    expect(oninput).not.toHaveBeenCalled();
  });

  it('paste: the same text over the same characters is not a change', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(InputOTP, { props: { ...named, length: 4, value: '1234', oninput } });
    await user.click(cells()[0]);
    await user.paste('1234');
    expect(oninput).not.toHaveBeenCalled();
    expect(values()).toEqual(['1', '2', '3', '4']);
  });

  it('keys: Backspace, Delete and the arrows do nothing while an IME composition is open', async () => {
    const oninput = vi.fn();
    render(InputOTP, { props: { ...named, length: 3, value: '123', oninput } });
    const middle = cells()[1];
    middle.focus();
    await fireEvent.keyDown(middle, { key: 'Backspace', isComposing: true });
    await fireEvent.keyDown(middle, { key: 'ArrowRight', isComposing: true });
    expect(values()).toEqual(['1', '2', '3']);
    expect(oninput).not.toHaveBeenCalled();
    expect(focused()).toBe(1);
  });

  // --- Callbacks ---

  it('onchange: called once when every cell is filled, with the whole text', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(InputOTP, { props: { ...named, length: 3, onchange } });
    await user.click(cells()[0]);
    await user.keyboard('12');
    expect(onchange).not.toHaveBeenCalled();
    await user.keyboard('3');
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledWith('123');
  });

  it('onchange: a replaced character of a full code reports again; removing one does not; a parent change does not', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(FieldHarness, { props: { component: InputOTP, initial: '123', ...named, length: 3, onchange } });
    expect(onchange).not.toHaveBeenCalled();
    await user.click(cells()[1]);
    await user.keyboard('9');
    expect(onchange).toHaveBeenCalledWith('193');
    await user.keyboard('{Backspace}');
    expect(onchange).toHaveBeenCalledTimes(1);
    screen.getByTestId('parent-set').click();
    await vi.waitFor(() => expect(values()).toEqual(['f', 'r', 'o']));
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  it('onchange: a paste that fills the field reports once', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(InputOTP, { props: { ...named, length: 4, onchange } });
    await user.click(cells()[0]);
    await user.paste('1234');
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledWith('1234');
  });

  it('oninput: called on each change with one entry per cell', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(InputOTP, { props: { ...named, length: 3, oninput } });
    await user.click(cells()[0]);
    await user.keyboard('12{Backspace}');
    expect(oninput.mock.calls.map((call) => call[0])).toEqual([['1', '', ''], ['1', '2', ''], ['1', '', '']]);
  });

  it('oninput: typing the character a cell already holds is not a change', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(InputOTP, { props: { ...named, length: 3, value: '123', oninput } });
    await user.click(cells()[1]);
    await user.keyboard('2');
    expect(oninput).not.toHaveBeenCalled();
  });

  // --- mask, formatter ---

  it('mask: true shows a bullet for each filled cell; the value is the real text', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputOTP, mask: true, ...named, length: 4 } });
    await user.click(cells()[0]);
    await user.keyboard('12');
    expect(values()).toEqual(['•', '•', '', '']);
    expect(parentValue()).toBe('12');
  });

  it('mask: a string is the character shown', () => {
    render(InputOTP, { props: { ...named, length: 3, value: '12', mask: '*' } });
    expect(values()).toEqual(['*', '*', '']);
  });

  it('mask: typing over a masked cell replaces its character', async () => {
    const user = userEvent.setup();
    render(FieldHarness, { props: { component: InputOTP, mask: '*', initial: '123', ...named, length: 3 } });
    await user.click(cells()[1]);
    await user.keyboard('9');
    expect(parentValue()).toBe('193');
    expect(values()).toEqual(['*', '*', '*']);
  });

  it('mask: false and an empty string show the characters', () => {
    const { unmount } = render(InputOTP, { props: { ...named, length: 2, value: '12', mask: false } });
    expect(values()).toEqual(['1', '2']);
    unmount();
    render(InputOTP, { props: { ...named, length: 2, value: '12', mask: '' } });
    expect(values()).toEqual(['1', '2']);
  });

  it('mask: more than one character throws outside production; in production the first is used', () => {
    expect(() => render(InputOTP, { props: { ...named, mask: '**' } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(InputOTP, { props: { ...named, length: 2, value: '12', mask: '**' } });
    expect(values()).toEqual(['*', '*']);
  });

  it('formatter: maps the whole text; cell i shows the i-th character of the result', () => {
    const formatter = vi.fn((value: string) => value.toUpperCase());
    render(InputOTP, { props: { ...named, length: 4, value: 'ab', formatter } });
    expect(values()).toEqual(['A', 'B', '', '']);
    expect(formatter).toHaveBeenCalledWith('ab');
  });

  it('formatter: a result shorter or longer than the text is shown as it is, cut to the cells', () => {
    render(InputOTP, { props: { ...named, length: 3, value: 'ab', formatter: () => 'xyzw' } });
    expect(values()).toEqual(['x', 'y', 'z']);
  });

  it('formatter: the mask wins over it', () => {
    render(InputOTP, { props: { ...named, length: 3, value: 'ab', mask: true, formatter: (value: string) => value.toUpperCase() } });
    expect(values()).toEqual(['•', '•', '']);
  });

  // --- separator ---

  it('separator: text is rendered after every cell but the last', () => {
    render(InputOTP, { props: { ...named, length: 4, separator: '-' } });
    const separators = [...group().querySelectorAll('.ads-input-otp-separator')];
    expect(separators).toHaveLength(3);
    expect(separators.map((separator) => separator.textContent)).toEqual(['-', '-', '-']);
    const children = [...group().children];
    expect(children[1]).toBe(separators[0]);
    expect(children.at(-1)).not.toBe(separators.at(-1));
  });

  it('separator: a snippet receives the index of the cell before it', () => {
    const separator = createRawSnippet((index: () => number) => ({ render: () => `<i>after ${index()}</i>` }));
    render(InputOTP, { props: { ...named, length: 3, separator } });
    expect([...group().querySelectorAll('.ads-input-otp-separator')].map((node) => node.textContent)).toEqual(['after 0', 'after 1']);
  });

  it('separator: none by default; one cell has none', () => {
    const { unmount } = render(InputOTP, { props: named });
    expect(group().querySelector('.ads-input-otp-separator')).toBeNull();
    unmount();
    render(InputOTP, { props: { ...named, length: 1, separator: '-' } });
    expect(group().querySelector('.ads-input-otp-separator')).toBeNull();
  });

  // --- disabled, size, variant, status, autocomplete ---

  it('disabled: every cell is disabled, nothing can be typed or pasted', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(InputOTP, { props: { ...named, length: 3, disabled: true, oninput } });
    cells().forEach((cell) => expect(cell).toBeDisabled());
    await user.click(cells()[0]);
    await user.keyboard('1');
    expect(values()).toEqual(['', '', '']);
    expect(oninput).not.toHaveBeenCalled();
  });

  it.each([
    ['large', 'ads-input-large', '--ads-control-height-lg'],
    ['small', 'ads-input-small', '--ads-control-height-sm'],
    ['medium', 'ads-input-medium', '--ads-control-height'],
    ['middle', 'ads-input-medium', '--ads-control-height'],
    ['default', 'ads-input-medium', '--ads-control-height']
  ] as const)('size: %s gives the cells %s and a width of the field height', (size, expected, token) => {
    render(InputOTP, { props: { ...named, size } });
    for (const cell of cells()) {
      const cellRoot = cell.closest('.ads-input') as HTMLElement;
      expect(cellRoot).toHaveClass(expected);
      expect(cellRoot.getAttribute('style')).toContain(`width: var(${token})`);
      expect(cellRoot.getAttribute('style')).toContain('--_pi: 0px');
    }
  });

  it('variant and status: reach every cell; an invalid status throws outside production', () => {
    render(InputOTP, { props: { ...named, length: 2, variant: 'filled', status: 'error' } });
    for (const cell of cells()) {
      expect(cell.closest('.ads-input')).toHaveClass('ads-input-filled', 'ads-input-status-error');
      expect(cell).toHaveAttribute('aria-invalid', 'true');
    }
  });

  it('variant and status: invalid values throw outside production', () => {
    expect(() => render(InputOTP, { props: { ...named, variant: 'solid' as never } })).toThrow(RangeError);
    expect(() => render(InputOTP, { props: { ...named, status: 'info' as never } })).toThrow(RangeError);
  });

  it('autocomplete: is forwarded to every cell', () => {
    render(InputOTP, { props: { ...named, length: 3, autocomplete: 'one-time-code' } });
    cells().forEach((cell) => expect(cell).toHaveAttribute('autocomplete', 'one-time-code'));
  });

  // --- IME ---

  it('IME: a composition in a cell is ignored until it ends, then its text is taken', async () => {
    const oninput = vi.fn();
    render(FieldHarness, { props: { component: InputOTP, ...named, length: 4, oninput } });
    const first = cells()[0];
    first.focus();
    await fireEvent.compositionStart(first);
    first.value = 'n';
    await fireEvent.input(first);
    first.value = '你';
    await fireEvent.input(first);
    expect(parentValue()).toBe('');
    expect(oninput).not.toHaveBeenCalled();
    await fireEvent.compositionEnd(first);
    expect(parentValue()).toBe('你');
    expect(oninput).toHaveBeenCalledTimes(1);
    expect(cells()[0].value).toBe('你');
  });

  // --- Parts, attributes ---

  it('classNames and styles: root, input and separator get their class and style', () => {
    render(InputOTP, {
      props: {
        ...named,
        length: 2,
        separator: '-',
        class: 'mine',
        style: 'margin: 2px',
        classNames: { root: 'c-root', input: 'c-input', separator: 'c-sep' },
        styles: { root: { color: 'red' }, input: { 'font-weight': 'bold' }, separator: { opacity: 0.5 } }
      }
    });
    expect(group()).toHaveClass('ads-input-otp', 'mine', 'c-root');
    expect(group().style.margin).toBe('2px');
    expect(group().style.color).toBe('red');
    for (const cell of cells()) {
      expect(cell).toHaveClass('c-input');
      expect(cell.style.fontWeight).toBe('bold');
      expect(cell.style.textAlign).toBe('center');
    }
    const separator = group().querySelector('.ads-input-otp-separator') as HTMLElement;
    expect(separator).toHaveClass('c-sep');
    expect(separator.style.opacity).toBe('0.5');
  });

  it('native attributes: id, data-* and aria-* reach the group, which keeps its role', () => {
    render(InputOTP, { props: { id: 'otp', 'data-x': '1', 'aria-describedby': 'hint', role: 'region', ...named } as never });
    expect(group()).toHaveAttribute('id', 'otp');
    expect(group()).toHaveAttribute('data-x', '1');
    expect(group()).toHaveAttribute('aria-describedby', 'hint');
    expect(group()).toHaveAttribute('role', 'group');
  });

  it('aria-labelledby: names the group, and the cells keep their own names', () => {
    render(InputOTP, { props: { 'aria-labelledby': 'title', length: 2 } });
    const title = document.createElement('span');
    title.id = 'title';
    title.textContent = 'Enter the code';
    document.body.append(title);
    expect(group()).toHaveAccessibleName('Enter the code');
    expect(cells()[0]).toHaveAccessibleName('Character 1 of 2');
    title.remove();
  });

  it('reactivity: changing size, variant, status and disabled re-renders every cell', async () => {
    const { rerender } = render(InputOTP, { props: { ...named, length: 2 } });
    await rerender({ size: 'small', variant: 'underlined', status: 'warning', disabled: true });
    for (const cell of cells()) {
      expect(appClasses(cell.closest('.ads-input'))).toEqual([
        'ads-input',
        'ads-input-small',
        'ads-input-underlined',
        'ads-input-status-warning',
        'ads-input-disabled'
      ]);
      expect(cell).toBeDisabled();
    }
  });

  // --- Methods ---

  it('focus(): moves focus to the first empty cell, or the last one when all are filled', () => {
    const { component, unmount } = render(InputOTP, { props: { ...named, length: 4, value: '12' } });
    (component as unknown as { focus(): void }).focus();
    expect(focused()).toBe(2);
    unmount();
    const full = render(InputOTP, { props: { ...named, length: 3, value: '123' } });
    (full.component as unknown as { focus(): void }).focus();
    expect(focused()).toBe(2);
  });

  it('focus(options): cursor and preventScroll reach the cell that takes focus', () => {
    const { component } = render(InputOTP, { props: { ...named, length: 4, value: '12' } });
    const methods = component as unknown as { focus(options?: { cursor?: 'start' | 'end' | 'all'; preventScroll?: boolean }): void };
    const spy = vi.spyOn(cells()[2], 'focus');
    methods.focus({ preventScroll: true });
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
    expect(focused()).toBe(2);
    const full = render(InputOTP, { props: { ...named, 'aria-label': 'Full', length: 1, value: '7' } });
    const filled = screen.getAllByRole('textbox').at(-1) as HTMLInputElement;
    (full.component as unknown as { focus(options: { cursor: 'all' }): void }).focus({ cursor: 'all' });
    expect(document.activeElement).toBe(filled);
    expect([filled.selectionStart, filled.selectionEnd]).toEqual([0, 1]);
  });

  it('blur(): removes focus from the cell that has it', () => {
    const { component } = render(InputOTP, { props: { ...named, length: 3 } });
    (component as unknown as { focus(): void }).focus();
    expect(focused()).toBe(0);
    (component as unknown as { blur(): void }).blur();
    expect(focused()).toBe(-1);
  });

  // --- a11y ---

  it('a11y: reports a group and cells without names only for the group (the cells are always named)', async () => {
    const { container } = render(InputOTP);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });

  it.each([
    ['plain', {}],
    ['filled and masked', { value: '123', mask: true }],
    ['disabled', { disabled: true }],
    ['error', { status: 'error' }],
    ['with separators', { separator: '-' }]
  ] as Array<[string, Record<string, unknown>]>)('a11y: has no axe violations: %s', async (_name, props) => {
    const { container } = render(InputOTP, { props: { ...named, ...props } as never });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });

  it('a11y: the cells are in the Tab order, each reached by Tab as long as it can take focus', async () => {
    const user = userEvent.setup();
    render(InputOTP, { props: { ...named, length: 3, value: '123' } });
    await user.tab();
    expect(focused()).toBe(0);
    await user.tab();
    expect(focused()).toBe(1);
  });
});
