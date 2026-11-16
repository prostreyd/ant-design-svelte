import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RadioGroup from '../src/lib/Radio/RadioGroup.svelte';
import RadioGroupHarness from './fixtures/RadioGroupHarness.svelte';
import RadioGroupMarkup from './fixtures/RadioGroupMarkup.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('form').forEach((element) => element.remove());
});

const group = () => screen.getByRole('radiogroup');
const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];
const radioNamed = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement;
const rootOf = (name: string) => radioNamed(name).closest('label') as HTMLLabelElement;
/** The values of the inputs that are checked. */
const checkedValues = () => radios().filter((input) => input.checked).map((input) => input.value);
const parentValue = () => screen.getByTestId('parent-value').textContent;
const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));
const styleOf = (element: Element | null) => (element as HTMLElement).style;
const fruits = ['Apple', 'Pear', 'Orange'];
const appClasses = (element: Element | null) =>
  [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('RadioGroup', () => {
  // --- Rendering and defaults ---

  it('default: a div with role radiogroup and no radios without options or children', () => {
    render(RadioGroup, { props: { 'aria-label': 'Empty' } });
    expect(group().tagName).toBe('DIV');
    expect(appClasses(group())).toEqual(['ads-radio-group', 'ads-radio-group-outline']);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('role: is not overridable', () => {
    render(RadioGroup, { props: { role: 'group', 'aria-label': 'Fruits' } as never });
    expect(group()).toHaveAttribute('role', 'radiogroup');
  });

  // --- value ---

  it('value: the initial value checks the matching radio and sets its class', () => {
    render(RadioGroup, { props: { options: fruits, value: 'Pear' } });
    expect(checkedValues()).toEqual(['Pear']);
    expect(rootOf('Pear')).toHaveClass('ads-radio-checked');
    expect(rootOf('Apple')).not.toHaveClass('ads-radio-checked');
  });

  it('value: with no value nothing is checked', () => {
    render(RadioGroup, { props: { options: fruits } });
    expect(checkedValues()).toEqual([]);
  });

  it('value: bind:value updates the parent on a click and follows another click', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits } });
    expect(parentValue()).toBe('undefined');
    await user.click(radioNamed('Apple'));
    expect(parentValue()).toBe('Apple');
    await user.click(radioNamed('Orange'));
    expect(parentValue()).toBe('Orange');
    expect(checkedValues()).toEqual(['Orange']);
  });

  it('value: a one-way value={x} selects locally without changing the parent', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, mode: 'plain', initial: 'Apple' } });
    await user.click(radioNamed('Pear'));
    expect(checkedValues()).toEqual(['Pear']);
    expect(parentValue()).toBe('Apple');
  });

  it('value: a change made by the parent re-renders the items and calls no onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroupHarness, { props: { options: fruits, initial: 'Apple', onchange } });
    await user.click(screen.getByTestId('parent-set'));
    expect(checkedValues()).toEqual(['Pear']);
    expect(onchange).not.toHaveBeenCalled();
  });

  it('value: a value that matches no radio checks nothing and is kept', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, initial: 'Pear', external: 'Kiwi' } });
    await user.click(screen.getByTestId('parent-set'));
    expect(checkedValues()).toEqual([]);
    expect(parentValue()).toBe('Kiwi');
  });

  it('value: undefined from the parent clears the selection', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, initial: 'Pear' } });
    expect(checkedValues()).toEqual(['Pear']);
    await user.click(screen.getByTestId('parent-clear'));
    expect(checkedValues()).toEqual([]);
    expect(rootOf('Pear')).not.toHaveClass('ads-radio-checked');
  });

  it('value: null means nothing selected, as undefined does', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, initial: 'Pear', external: null } });
    await user.click(screen.getByTestId('parent-set'));
    expect(checkedValues()).toEqual([]);
  });

  it('value: 1 and "1" are different values, compared strictly', () => {
    render(RadioGroup, { props: { options: [{ label: 'Number', value: 1 }, { label: 'Text', value: '1' }], value: 1 } });
    expect(radioNamed('Number')).toBeChecked();
    expect(radioNamed('Text')).not.toBeChecked();
  });

  it('value: false and 0 are values: they select their radios and come back unchanged in onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, {
      props: {
        options: [{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'None', value: 0 }],
        value: false,
        onchange
      }
    });
    expect(checkedValues()).toEqual(['false']);
    await user.click(radioNamed('None'));
    expect(onchange.mock.calls[0][0]).toBe(0);
    await user.click(radioNamed('Yes'));
    expect(onchange.mock.calls[1][0]).toBe(true);
    await user.click(radioNamed('No'));
    expect(onchange.mock.calls[2][0]).toBe(false);
    expect(radios().map((input) => input.value)).toEqual(['true', 'false', '0']);
  });

  // --- options ---

  it('options: strings are both the value and the label', () => {
    render(RadioGroup, { props: { options: fruits } });
    expect(radios().map((input) => input.value)).toEqual(fruits);
    for (const name of fruits) expect(radioNamed(name)).toBeInTheDocument();
  });

  it('options: numbers and booleans are both the value and the label (as text)', () => {
    render(RadioGroup, { props: { options: [1, 2, true] } });
    expect(radioNamed('1').value).toBe('1');
    expect(radioNamed('2').value).toBe('2');
    expect(radioNamed('true').value).toBe('true');
  });

  it('options: objects give the label, the value, disabled, title, id, required, class and style', () => {
    render(RadioGroup, {
      props: {
        options: [
          { label: 'Apple', value: 'a' },
          {
            label: 'Pear',
            value: 'p',
            disabled: true,
            title: 'Out of stock',
            id: 'pear-input',
            required: true,
            class: 'mine',
            style: 'opacity: 0.5'
          }
        ]
      }
    });
    expect(radioNamed('Pear')).toBeDisabled();
    expect(radioNamed('Pear')).toHaveAttribute('id', 'pear-input');
    expect(radioNamed('Pear')).toBeRequired();
    expect(radioNamed('Apple')).not.toBeRequired();
    expect(rootOf('Pear')).toHaveAttribute('title', 'Out of stock');
    expect(rootOf('Pear')).toHaveClass('mine');
    expect(styleOf(rootOf('Pear')).opacity).toBe('0.5');
    expect(radioNamed('Apple')).not.toBeDisabled();
  });

  it('options: a label can be a snippet', () => {
    render(RadioGroup, { props: { options: [{ label: text('Cherry'), value: 'c' }] } });
    expect(radioNamed('Cherry')).toBeInTheDocument();
    expect(screen.getByText('Cherry').tagName).toBe('B');
  });

  it('options: a label can be a snippet in a button group too', () => {
    render(RadioGroup, { props: { optionType: 'button', options: [{ label: text('Cherry'), value: 'c' }] } });
    expect(radioNamed('Cherry')).toBeInTheDocument();
    expect(screen.getByText('Cherry').tagName).toBe('B');
  });

  it('options: a disabled option cannot be selected, a click does nothing', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, { props: { options: [{ label: 'Apple', value: 'a', disabled: true }], onchange } });
    await user.click(screen.getByText('Apple'));
    expect(onchange).not.toHaveBeenCalled();
    expect(radioNamed('Apple')).not.toBeChecked();
  });

  it('options: an option onchange runs with (true, event) before the group onchange', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(RadioGroup, {
      props: {
        options: [{ label: 'Apple', value: 'a', onchange: (checked: boolean) => calls.push(`option ${checked}`) }, 'Pear'],
        onchange: (value: unknown) => calls.push(`group ${String(value)}`)
      }
    });
    await user.click(radioNamed('Apple'));
    expect(calls).toEqual(['option true', 'group a']);
  });

  it('options: changed options re-render', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits, value: 'Pear' } });
    await rerender({ options: ['Pear', 'Kiwi'] });
    expect(radios().map((input) => input.value)).toEqual(['Pear', 'Kiwi']);
    expect(checkedValues()).toEqual(['Pear']);
  });

  it('options: empty options render the children, non-empty options ignore them', async () => {
    const { rerender } = render(RadioGroupMarkup, { props: { options: [], 'aria-label': 'Fruits' } });
    expect(radios()).toHaveLength(3);
    await rerender({ options: ['Only'] });
    expect(radios().map((input) => input.value)).toEqual(['Only']);
  });

  // --- optionType, buttonStyle, size, orientation, vertical, block ---

  it('optionType: default renders plain radios, button renders buttons', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits } });
    expect(rootOf('Apple')).toHaveClass('ads-radio');
    expect(rootOf('Apple')).not.toHaveClass('ads-radio-button');
    await rerender({ optionType: 'button' });
    expect(rootOf('Apple')).toHaveClass('ads-radio-button');
    expect(rootOf('Apple')).not.toHaveClass('ads-radio');
    expect(rootOf('Apple').querySelector('.ads-radio-icon')).toBeNull();
  });

  it('optionType: children keep the type their author chose', () => {
    render(RadioGroupMarkup, { props: { variant: 'mixed', optionType: 'button', 'aria-label': 'Mixed' } });
    expect(rootOf('Apple')).toHaveClass('ads-radio');
    expect(rootOf('Pear')).toHaveClass('ads-radio-button');
  });

  it.each([
    ['optionType', 'toggle'],
    ['buttonStyle', 'dashed'],
    ['size', 'huge'],
    ['orientation', 'diagonal']
  ])('%s: an invalid value throws outside production and falls back in production', (prop, bad) => {
    expect(() => render(RadioGroup, { props: { options: fruits, [prop]: bad } as never })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => render(RadioGroup, { props: { options: fruits, [prop]: bad } as never })).not.toThrow();
  });

  it('buttonStyle: solid is on the group and on every button; outline is the default', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits, optionType: 'button' } });
    expect(group()).toHaveClass('ads-radio-group-outline');
    expect(rootOf('Apple')).not.toHaveClass('ads-radio-button-solid');
    await rerender({ buttonStyle: 'solid' });
    expect(group()).toHaveClass('ads-radio-group-solid');
    expect(group()).not.toHaveClass('ads-radio-group-outline');
    expect(rootOf('Apple')).toHaveClass('ads-radio-button-solid');
  });

  it.each([
    ['large', 'ads-radio-button-large'],
    ['small', 'ads-radio-button-small'],
    ['medium', null],
    ['middle', null],
    ['default', null]
  ])('size: %s gives the button class %s', (size, expected) => {
    render(RadioGroup, { props: { options: fruits, optionType: 'button', size: size as never } });
    const classes = appClasses(rootOf('Apple'));
    if (expected) expect(classes).toContain(expected);
    else expect(classes.filter((name) => /-(large|small)$/.test(name))).toEqual([]);
  });

  it('size: plain radios ignore it', () => {
    render(RadioGroup, { props: { options: fruits, size: 'large' } });
    expect(appClasses(rootOf('Apple'))).toEqual(['ads-radio', 'ads-radio-grouped']);
  });

  it('orientation: vertical is on the group and on every item; horizontal is the default', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits } });
    expect(group()).not.toHaveClass('ads-radio-group-vertical');
    await rerender({ orientation: 'vertical' });
    expect(group()).toHaveClass('ads-radio-group-vertical');
    expect(rootOf('Apple')).toHaveClass('ads-radio-vertical');
  });

  it('orientation: vertical gives the same to buttons', () => {
    render(RadioGroup, { props: { options: fruits, optionType: 'button', orientation: 'vertical' } });
    expect(rootOf('Apple')).toHaveClass('ads-radio-button-vertical');
  });

  it('vertical: alone it lays the items out in a column', () => {
    render(RadioGroup, { props: { options: fruits, vertical: true } });
    expect(group()).toHaveClass('ads-radio-group-vertical');
  });

  it('vertical: orientation wins over it in both directions', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits, vertical: true, orientation: 'horizontal' } });
    expect(group()).not.toHaveClass('ads-radio-group-vertical');
    await rerender({ vertical: false, orientation: 'vertical' });
    expect(group()).toHaveClass('ads-radio-group-vertical');
  });

  it('block: is on the group and on every item', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits, optionType: 'button' } });
    expect(group()).not.toHaveClass('ads-radio-group-block');
    await rerender({ block: true });
    expect(group()).toHaveClass('ads-radio-group-block');
    expect(rootOf('Apple')).toHaveClass('ads-radio-button-block');
  });

  it('block: plain radios get the item class too', () => {
    render(RadioGroup, { props: { options: fruits, block: true } });
    expect(rootOf('Apple')).toHaveClass('ads-radio-block');
  });

  // --- children mode ---

  it('children: a radio reads its state from the group, and its own checked is ignored', () => {
    render(RadioGroupMarkup, { props: { variant: 'own-checked', value: 'p', 'aria-label': 'Fruits' } });
    expect(checkedValues()).toEqual(['p']);
    expect(radioNamed('Apple')).not.toBeChecked();
  });

  it('children: radios nested in other elements take part', async () => {
    const user = userEvent.setup();
    render(RadioGroupMarkup, { props: { variant: 'nested', 'aria-label': 'Fruits' } });
    await user.click(radioNamed('Pear'));
    expect(checkedValues()).toEqual(['p']);
    await user.click(radioNamed('Apple'));
    expect(checkedValues()).toEqual(['a']);
  });

  it('children: buttons take part and take the look of the group', () => {
    render(RadioGroupMarkup, {
      props: { variant: 'buttons', buttonStyle: 'solid', size: 'large', value: 'o', 'aria-label': 'Fruits' }
    });
    expect(rootOf('Orange')).toHaveClass('ads-radio-button-checked', 'ads-radio-button-solid', 'ads-radio-button-large');
    expect(rootOf('Apple')).not.toHaveClass('ads-radio-button-checked');
  });

  it('children: a button without a value throws outside production and stays standalone in production', async () => {
    const user = userEvent.setup();
    expect(() => render(RadioGroupMarkup, { props: { variant: 'button-novalue', 'aria-label': 'Fruits' } })).toThrow(TypeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(RadioGroupMarkup, { props: { variant: 'button-novalue', value: 'a', 'aria-label': 'Fruits' } });
    expect(radioNamed('Apple')).not.toBeChecked();
    await user.click(radioNamed('Apple'));
    expect(radioNamed('Apple')).toBeChecked();
  });

  it('children: a radio without a value throws outside production and stays standalone in production', async () => {
    const user = userEvent.setup();
    expect(() => render(RadioGroupMarkup, { props: { variant: 'novalue', 'aria-label': 'Fruits' } })).toThrow(TypeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(RadioGroupMarkup, { props: { variant: 'novalue', value: 'a', 'aria-label': 'Fruits' } });
    expect(radioNamed('Apple')).not.toBeChecked();
    await user.click(radioNamed('Apple'));
    expect(radioNamed('Apple')).toBeChecked();
  });

  // --- disabled and name ---

  it('disabled: the group disables every radio and an item can be disabled alone', async () => {
    const { rerender } = render(RadioGroup, {
      props: { options: [{ label: 'Apple', value: 'a', disabled: true }, 'Pear'] }
    });
    expect(radioNamed('Apple')).toBeDisabled();
    expect(radioNamed('Pear')).not.toBeDisabled();
    await rerender({ disabled: true });
    for (const input of radios()) expect(input).toBeDisabled();
    for (const input of radios()) expect(input.closest('label')).toHaveClass('ads-radio-disabled');
  });

  it('name: the group name is on every input and wins over an item name', () => {
    render(RadioGroupMarkup, { props: { variant: 'plain', name: 'fruit', 'aria-label': 'Fruits' } });
    expect(radios().map((input) => input.name)).toEqual(['fruit', 'fruit', 'fruit']);
  });

  it('name: without one the group makes a name of its own, the same for all its inputs, and a different one per group', () => {
    render(RadioGroup, { props: { options: fruits, 'aria-label': 'One' } });
    render(RadioGroup, { props: { options: fruits, 'aria-label': 'Two' } });
    const names = radios().map((input) => input.name);
    expect(new Set(names.slice(0, 3)).size).toBe(1);
    expect(new Set(names.slice(3)).size).toBe(1);
    expect(names[0]).toMatch(/^ads-radio-group-/);
    expect(names[0]).not.toBe(names[3]);
  });

  it('name: an empty name counts as none', () => {
    render(RadioGroup, { props: { options: fruits, name: '' } });
    expect(radios()[0].name).toMatch(/^ads-radio-group-/);
  });

  it('name: a changed name reaches the inputs', async () => {
    const { rerender } = render(RadioGroup, { props: { options: fruits, name: 'a' } });
    await rerender({ name: 'b' });
    expect(radios().map((input) => input.name)).toEqual(['b', 'b', 'b']);
  });

  it('name: the generated name is the same in the server markup for every input', () => {
    const root = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'src/lib/Radio/RadioGroup.svelte', props: { options: ['a', 'b'], value: 'b' } }])],
      { cwd: root, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    const names = [...html.matchAll(/name="(ads-radio-group-[^"]+)"/g)].map((match) => match[1]);
    expect(names).toHaveLength(2);
    expect(names[0]).toBe(names[1]);
    expect(html).toContain('role="radiogroup"');
    expect(html).toMatch(/value="b"[^>]*checked|checked[^>]*value="b"/);
  });

  // --- onchange ---

  it('onchange: called once per selection with the value and the change event of the selected input', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, { props: { options: fruits, onchange } });
    await user.click(radioNamed('Pear'));
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0]).toBe('Pear');
    expect(onchange.mock.calls[0][1]).toBeInstanceOf(Event);
    expect(onchange.mock.calls[0][1].type).toBe('change');
    expect(onchange.mock.calls[0][1].target).toBe(radioNamed('Pear'));
  });

  it('onchange: is not called when the checked radio is selected again', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, { props: { options: fruits, value: 'Pear', onchange } });
    await user.click(radioNamed('Pear'));
    await user.click(screen.getByText('Pear'));
    expect(onchange).not.toHaveBeenCalled();
    expect(checkedValues()).toEqual(['Pear']);
  });

  it('onchange: the item onchange runs before the group onchange', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(RadioGroupMarkup, {
      props: {
        variant: 'item-onchange',
        log: (entry: string) => calls.push(entry),
        onchange: (value: unknown) => calls.push(`group ${String(value)}`),
        'aria-label': 'Fruits'
      }
    });
    await user.click(radioNamed('Pear'));
    expect(calls).toEqual(['item p', 'group p']);
  });

  it('onchange: a click on the text selects and calls it once', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, { props: { options: fruits, onchange } });
    await user.click(screen.getByText('Orange'));
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0]).toBe('Orange');
  });

  it('function binding: a parent that refuses a change puts the previous radio back and leaves exactly one checked', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, mode: 'confirm', allow: false, initial: 'Apple' } });
    expect(checkedValues()).toEqual(['Apple']);
    await user.click(radioNamed('Pear'));
    expect(parentValue()).toBe('Apple');
    expect(checkedValues()).toEqual(['Apple']);
    expect(rootOf('Apple')).toHaveClass('ads-radio-checked');
    expect(rootOf('Pear')).not.toHaveClass('ads-radio-checked');
  });

  it('function binding: a parent that refuses the first selection leaves nothing checked', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, mode: 'confirm', allow: false } });
    await user.click(radioNamed('Pear'));
    expect(checkedValues()).toEqual([]);
  });

  it('function binding: a parent that accepts a change moves the selection', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, { props: { options: fruits, mode: 'confirm', allow: true, initial: 'Apple' } });
    await user.click(radioNamed('Pear'));
    expect(parentValue()).toBe('Pear');
    expect(checkedValues()).toEqual(['Pear']);
  });

  it('function binding: a refused change in buttons puts the previous button back', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, {
      props: { options: fruits, optionType: 'button', mode: 'confirm', allow: false, initial: 'Orange' }
    });
    await user.click(radioNamed('Apple'));
    expect(checkedValues()).toEqual(['Orange']);
    expect(rootOf('Orange')).toHaveClass('ads-radio-button-checked');
  });

  // --- Keyboard ---

  it('keyboard: the arrow keys move the selection through the group and wrap around', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, { props: { options: fruits, value: 'Apple', onchange } });
    radioNamed('Apple').focus();
    await user.keyboard('{ArrowRight}');
    expect(checkedValues()).toEqual(['Pear']);
    expect(radioNamed('Pear')).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(checkedValues()).toEqual(['Apple']);
    await user.keyboard('{ArrowLeft}');
    expect(checkedValues()).toEqual(['Orange']);
    expect(onchange.mock.calls.map((call) => call[0])).toEqual(['Pear', 'Orange', 'Apple', 'Orange']);
  });

  it('keyboard: the arrow keys skip a disabled radio', async () => {
    const user = userEvent.setup();
    render(RadioGroup, {
      props: { options: ['Apple', { label: 'Pear', value: 'Pear', disabled: true }, 'Orange'], value: 'Apple' }
    });
    radioNamed('Apple').focus();
    await user.keyboard('{ArrowRight}');
    expect(checkedValues()).toEqual(['Orange']);
  });

  it('keyboard: Space selects the focused radio', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(RadioGroup, { props: { options: fruits, onchange } });
    radioNamed('Pear').focus();
    await user.keyboard(' ');
    expect(checkedValues()).toEqual(['Pear']);
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  // --- classNames and styles ---

  it('classNames and styles: root, and class and style, reach the group', () => {
    render(RadioGroup, {
      props: {
        options: fruits,
        class: 'mine',
        style: 'margin-top: 4px; color: red',
        classNames: { root: 'from-parts' },
        styles: { root: { color: 'blue' } },
        'data-qa': 'g'
      } as never
    });
    expect(group()).toHaveClass('mine', 'from-parts');
    expect(styleOf(group()).marginTop).toBe('4px');
    expect(styleOf(group()).color).toBe('blue');
    expect(group()).toHaveAttribute('data-qa', 'g');
  });

  it('classNames and styles: item, itemIcon and itemLabel reach every radio in options mode', () => {
    render(RadioGroup, {
      props: {
        options: [{ label: 'Apple', value: 'a', class: 'own' }, 'Pear'],
        classNames: { item: 'it', itemIcon: 'ic', itemLabel: 'lb' },
        styles: { item: { color: 'red' }, itemIcon: { 'border-width': '3px' }, itemLabel: { 'flex-grow': 2 } }
      }
    });
    for (const name of ['Apple', 'Pear']) {
      expect(rootOf(name)).toHaveClass('it');
      expect(styleOf(rootOf(name)).color).toBe('red');
      expect(rootOf(name).querySelector('.ads-radio-icon')).toHaveClass('ic');
      expect(styleOf(rootOf(name).querySelector('.ads-radio-icon')).borderWidth).toBe('3px');
      expect(rootOf(name).querySelector('.ads-radio-label')).toHaveClass('lb');
      expect(styleOf(rootOf(name).querySelector('.ads-radio-label')).flexGrow).toBe('2');
    }
    expect(rootOf('Apple')).toHaveClass('own');
  });

  it('classNames and styles: the same reach radios placed in children', () => {
    render(RadioGroupMarkup, {
      props: {
        variant: 'nested',
        classNames: { item: 'it', itemLabel: 'lb' },
        styles: { item: { color: 'red' } },
        'aria-label': 'Fruits'
      }
    });
    expect(rootOf('Apple')).toHaveClass('it');
    expect(styleOf(rootOf('Pear')).color).toBe('red');
    expect(rootOf('Apple').querySelector('.ads-radio-label')).toHaveClass('lb');
  });

  it('classNames and styles: the item own styles win over the group item styles', () => {
    render(RadioGroup, {
      props: {
        options: [{ label: 'Apple', value: 'a', style: 'color: green' }],
        styles: { item: { color: 'red' } }
      }
    });
    expect(styleOf(rootOf('Apple')).color).toBe('green');
  });

  it('classNames and styles: itemLabel reaches the label of a button, itemIcon does nothing for buttons', () => {
    render(RadioGroup, {
      props: {
        options: fruits,
        optionType: 'button',
        classNames: { itemIcon: 'ic', itemLabel: 'lb' }
      }
    });
    expect(rootOf('Apple').querySelector('.ads-radio-button-label')).toHaveClass('lb');
    expect(document.querySelector('.ic')).toBeNull();
  });

  // --- Forms ---

  it('forms: a named group submits the pair of the checked radio, and only that one', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioGroup, { target: form, props: { options: fruits, name: 'fruit' } });
    expect(new FormData(form).get('fruit')).toBeNull();
    await user.click(radioNamed('Pear'));
    expect(new FormData(form).getAll('fruit')).toEqual(['Pear']);
  });

  it('forms: a boolean value is submitted as text', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioGroup, {
      target: form,
      props: { name: 'agree', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] }
    });
    await user.click(radioNamed('No'));
    expect(new FormData(form).get('agree')).toBe('false');
  });

  it('forms: an unnamed group is not submitted and its inputs have no form owner', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioGroup, { target: form, props: { options: fruits } });
    await user.click(radioNamed('Pear'));
    expect([...new FormData(form).keys()]).toEqual([]);
    for (const input of radios()) {
      expect(input.form).toBeNull();
      expect(input).toHaveAttribute('form');
    }
  });

  it('forms: a named group belongs to the surrounding form and has no form attribute', () => {
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioGroup, { target: form, props: { options: fruits, name: 'fruit' } });
    for (const input of radios()) {
      expect(input.form).toBe(form);
      expect(input).not.toHaveAttribute('form');
    }
  });

  it('form reset: a native reset restores the radios to the value of the group', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioGroup, { target: form, props: { options: fruits, name: 'fruit', value: 'Apple' } });
    await user.click(radioNamed('Pear'));
    expect(checkedValues()).toEqual(['Pear']);
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await tick();
    expect(checkedValues()).toEqual(['Pear']);
  });

  it('form reset: the parent that resets its value in onreset gets matching radios', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(RadioGroupHarness, { target: form, props: { options: fruits, name: 'fruit', initial: 'Apple' } });
    await user.click(radioNamed('Orange'));
    form.addEventListener('reset', () => screen.getByTestId('parent-clear').click());
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await tick();
    expect(parentValue()).toBe('undefined');
    expect(checkedValues()).toEqual([]);
  });

  // --- Integration ---

  it('integration: a button group with a disabled option, bind:value and a refused change', async () => {
    const user = userEvent.setup();
    render(RadioGroupHarness, {
      props: {
        optionType: 'button',
        buttonStyle: 'solid',
        options: ['Apple', { label: 'Pear', value: 'Pear', disabled: true }, 'Orange'],
        initial: 'Apple',
        'aria-label': 'Fruits'
      }
    });
    await user.click(radioNamed('Pear'));
    expect(parentValue()).toBe('Apple');
    await user.click(radioNamed('Orange'));
    expect(parentValue()).toBe('Orange');
    expect(rootOf('Orange')).toHaveClass('ads-radio-button-checked', 'ads-radio-button-solid');
  });

  // --- a11y ---

  it('axe: a group named with aria-labelledby, with aria-required and aria-invalid, checked and disabled items', async () => {
    const heading = document.createElement('span');
    heading.id = 'fruit-title';
    heading.textContent = 'Fruit';
    document.body.append(heading);
    const { container } = render(RadioGroup, {
      props: {
        options: ['Apple', { label: 'Pear', value: 'Pear', disabled: true }, 'Orange'],
        value: 'Orange',
        'aria-labelledby': 'fruit-title',
        'aria-required': true,
        'aria-invalid': false
      } as never
    });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
    heading.remove();
  });

  it('axe: a button group has no violations', async () => {
    const { container } = render(RadioGroup, {
      props: { options: fruits, optionType: 'button', buttonStyle: 'solid', value: 'Pear', 'aria-label': 'Fruits' }
    });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });

  it('axe: a group of children markup has no violations', async () => {
    const { container } = render(RadioGroupMarkup, { props: { variant: 'nested', 'aria-label': 'Fruits' } });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
