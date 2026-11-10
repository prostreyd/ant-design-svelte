import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CheckboxGroup from '../src/lib/Checkbox/CheckboxGroup.svelte';
import CheckAllHarness from './fixtures/CheckAllHarness.svelte';
import CheckboxGroupHarness from './fixtures/CheckboxGroupHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
});

const group = () => screen.getByRole('group');
const boxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];
const box = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;
const rootOf = (name: string) => box(name).closest('label') as HTMLLabelElement;
const parentValue = () => screen.getByTestId('parent-value').textContent;
const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));
const styleOf = (element: Element | null) => (element as HTMLElement).style;
const fruits = ['Apple', 'Pear', 'Orange'];

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('CheckboxGroup', () => {
  // --- Rendering and defaults ---

  it('default: a div with role group and no checkboxes without options or children', () => {
    render(CheckboxGroup, { props: { 'aria-label': 'Empty' } });
    expect(group().tagName).toBe('DIV');
    expect(group()).toHaveClass('ads-checkbox-group');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  // --- options ---

  it('options: strings are both the value and the label', () => {
    render(CheckboxGroup, { props: { options: fruits } });
    expect(boxes().map((input) => input.value)).toEqual(fruits);
    for (const name of fruits) expect(box(name)).toBeInTheDocument();
  });

  it('options: numbers are both the value and the label', () => {
    render(CheckboxGroup, { props: { options: [1, 2] } });
    expect(box('1').value).toBe('1');
    expect(box('2').value).toBe('2');
  });

  it('options: objects give the label, the value, disabled, title, class and style', () => {
    render(CheckboxGroup, {
      props: {
        options: [
          { label: 'Apple', value: 'a' },
          { label: 'Pear', value: 'p', disabled: true, title: 'Out of stock', class: 'mine', style: 'opacity: 0.5' }
        ]
      }
    });
    expect(box('Apple').value).toBe('a');
    expect(box('Pear').value).toBe('p');
    expect(box('Pear')).toBeDisabled();
    expect(box('Apple')).not.toBeDisabled();
    expect(rootOf('Pear')).toHaveAttribute('title', 'Out of stock');
    expect(rootOf('Pear')).toHaveClass('mine');
    expect(styleOf(rootOf('Pear')).opacity).toBe('0.5');
    expect(rootOf('Apple')).not.toHaveAttribute('title');
  });

  it('options: a label can be a snippet', () => {
    render(CheckboxGroup, { props: { options: [{ label: text('Bold apple'), value: 'a' }] } });
    expect(box('Bold apple').value).toBe('a');
    expect(rootOf('Bold apple').querySelector('.ads-checkbox-label b')).toHaveTextContent('Bold apple');
  });

  it('options: an option onchange is called before the group onchange', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    render(CheckboxGroup, {
      props: {
        options: [{ label: 'Apple', value: 'a', onchange: (checked) => order.push(`option:${checked}`) }],
        onchange: (value) => order.push(`group:${value.join(',')}`)
      }
    });
    await user.click(box('Apple'));
    expect(order).toEqual(['option:true', 'group:a']);
  });

  it('options: changed options re-render the checkboxes and leave value alone', async () => {
    const { rerender } = render(CheckboxGroupHarness, { props: { initial: ['Pear'], options: fruits } });
    await rerender({ options: ['Pear', 'Plum'] });
    expect(boxes().map((input) => input.value)).toEqual(['Pear', 'Plum']);
    expect(box('Pear')).toBeChecked();
    expect(parentValue()).toBe('["Pear"]');
  });

  it('options: empty options render the children, non-empty options ignore them', async () => {
    const { rerender } = render(CheckboxGroupHarness, { props: { markup: true, options: [] } });
    expect(boxes().map((input) => input.value)).toEqual(['a', 'b', 'c']);
    await rerender({ options: fruits });
    expect(boxes().map((input) => input.value)).toEqual(fruits);
  });

  // --- value ---

  it('value: the initial values are checked', () => {
    render(CheckboxGroup, { props: { options: fruits, value: ['Pear'] } });
    expect(box('Pear')).toBeChecked();
    expect(box('Apple')).not.toBeChecked();
    expect(rootOf('Pear')).toHaveClass('ads-checkbox-checked');
  });

  it('value: bind:value updates the parent on each toggle, in the order of the options', async () => {
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { options: fruits } });
    await user.click(box('Orange'));
    expect(parentValue()).toBe('["Orange"]');
    await user.click(box('Apple'));
    expect(parentValue()).toBe('["Apple","Orange"]');
    await user.click(box('Orange'));
    expect(parentValue()).toBe('["Apple"]');
    expect(box('Orange')).not.toBeChecked();
    expect(box('Apple')).toBeChecked();
  });

  it('value: a one-way value={values} toggles locally without changing the parent', async () => {
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { mode: 'plain', options: fruits } });
    await user.click(box('Apple'));
    expect(box('Apple')).toBeChecked();
    expect(parentValue()).toBe('[]');
  });

  it('value: a change made by the parent re-renders the checkboxes without onchange', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(CheckboxGroupHarness, { props: { initial: ['a'], options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }], onchange } });
    expect(box('A')).toBeChecked();
    await user.click(screen.getByTestId('parent-set'));
    expect(box('A')).not.toBeChecked();
    expect(box('B')).toBeChecked();
    expect(onchange).not.toHaveBeenCalled();
  });

  it('value: unknown values are kept, after the known ones', async () => {
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { initial: ['x', 'Orange'], options: fruits } });
    await user.click(box('Apple'));
    expect(parentValue()).toBe('["Apple","Orange","x"]');
  });

  it('value: a change event that reports an already selected value keeps the array as it is', async () => {
    const onchange = vi.fn();
    render(CheckboxGroupHarness, { props: { initial: ['Apple'], options: fruits, onchange } });
    await fireEvent.change(box('Apple'));
    expect(onchange).toHaveBeenCalledWith(['Apple'], expect.any(Event));
    expect(parentValue()).toBe('["Apple"]');
  });

  // --- onchange ---

  it('onchange: called once per toggle with a new array and the change event of the toggled input', async () => {
    const user = userEvent.setup();
    const initial = ['Pear'];
    const onchange = vi.fn();
    render(CheckboxGroup, { props: { options: fruits, value: initial, onchange } });
    await user.click(box('Apple'));
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0]).toEqual(['Apple', 'Pear']);
    expect(onchange.mock.calls[0][0]).not.toBe(initial);
    expect(initial).toEqual(['Pear']);
    expect(onchange.mock.calls[0][1].type).toBe('change');
    expect(onchange.mock.calls[0][1].target).toBe(box('Apple'));
  });

  it('onchange: the onchange of the checkbox runs before the one of the group', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    render(CheckboxGroupHarness, {
      props: { markup: true, onApple: (checked) => order.push(`item:${checked}`), onchange: (value) => order.push(`group:${value.join(',')}`) }
    });
    await user.click(box('Apple'));
    expect(order).toEqual(['item:true', 'group:a']);
  });

  it('function binding: a parent that refuses the change reverts the toggled input', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(CheckboxGroupHarness, { props: { mode: 'confirm', allow: false, options: fruits, onchange } });
    await user.click(box('Apple'));
    expect(parentValue()).toBe('[]');
    expect(box('Apple')).not.toBeChecked();
    expect(rootOf('Apple')).not.toHaveClass('ads-checkbox-checked');
    expect(onchange).toHaveBeenCalledWith(['Apple'], expect.any(Event));
  });

  it('function binding: a parent that accepts the change checks the box', async () => {
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { mode: 'confirm', allow: true, options: fruits } });
    await user.click(box('Apple'));
    expect(parentValue()).toBe('["Apple"]');
    expect(box('Apple')).toBeChecked();
  });

  // --- disabled and name ---

  it('disabled: disables every checkbox, and can be turned on later', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const { rerender } = render(CheckboxGroup, { props: { options: fruits, onchange } });
    for (const input of boxes()) expect(input).not.toBeDisabled();
    await rerender({ disabled: true });
    for (const input of boxes()) expect(input).toBeDisabled();
    for (const name of fruits) expect(rootOf(name)).toHaveClass('ads-checkbox-disabled');
    await user.click(box('Apple'));
    expect(onchange).not.toHaveBeenCalled();
  });

  it("disabled: a checkbox's own disabled disables that one alone, in markup too", () => {
    render(CheckboxGroupHarness, { props: { markup: true, cherryDisabled: true } });
    expect(box('Cherry')).toBeDisabled();
    expect(box('Apple')).not.toBeDisabled();
    expect(box('Banana')).not.toBeDisabled();
  });

  it('name: is applied to every input and wins over the own name of a checkbox', () => {
    render(CheckboxGroupHarness, { props: { markup: true, name: 'fruits' } });
    for (const input of boxes()) expect(input).toHaveAttribute('name', 'fruits');
  });

  it('name: without a group name a checkbox keeps its own', () => {
    render(CheckboxGroupHarness, { props: { markup: true } });
    expect(box('Apple')).toHaveAttribute('name', 'own');
    expect(box('Banana')).not.toHaveAttribute('name');
  });

  // --- children (custom markup) ---

  it('children: checkboxes anywhere inside read their state from the group; their own checked is ignored', async () => {
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { markup: true, initial: ['c'] } });
    expect(box('Banana')).not.toBeChecked();
    expect(box('Cherry')).toBeChecked();
    expect(box('Cherry').closest('.cell')).not.toBeNull();
    await user.click(box('Banana'));
    expect(parentValue()).toBe('["b","c"]');
    expect(box('Banana')).toBeChecked();
  });

  it('children: the order of the values is the order of the checkboxes', async () => {
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { markup: true } });
    await user.click(box('Cherry'));
    await user.click(box('Apple'));
    expect(parentValue()).toBe('["a","c"]');
    await user.click(box('Banana'));
    expect(parentValue()).toBe('["a","b","c"]');
  });

  it('children: a checkbox without a value throws a TypeError outside production', () => {
    let caught: unknown;
    try {
      render(CheckboxGroupHarness, { props: { markup: true, unvalued: true } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(TypeError);
    expect((caught as Error).message).toContain('Checkbox inside a CheckboxGroup needs a value.');
  });

  it('children: a checkbox without a value keeps its own state in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const user = userEvent.setup();
    render(CheckboxGroupHarness, { props: { markup: true, unvalued: true, name: 'fruits' } });
    await user.click(box('No value'));
    expect(box('No value')).toBeChecked();
    expect(parentValue()).toBe('[]');
    expect(box('No value')).toHaveAttribute('name', 'fruits');
    await user.click(box('Apple'));
    expect(parentValue()).toBe('["a"]');
  });

  it('children: a removed checkbox no longer counts for the order', async () => {
    const user = userEvent.setup();
    const { rerender } = render(CheckboxGroupHarness, { props: { markup: true, unvalued: false } });
    await rerender({ markup: false });
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    await rerender({ markup: true });
    await user.click(box('Cherry'));
    await user.click(box('Apple'));
    expect(parentValue()).toBe('["a","c"]');
  });

  // --- classNames / styles / class / style / native attributes ---

  it('classNames: root gets its class, and the item parts reach every checkbox generated from options', () => {
    render(CheckboxGroup, {
      props: { options: fruits, class: 'mine', classNames: { root: 'g-root', item: 'g-item', itemIcon: 'g-icon', itemLabel: 'g-label' } }
    });
    expect(group()).toHaveClass('ads-checkbox-group', 'mine', 'g-root');
    for (const name of fruits) {
      expect(rootOf(name)).toHaveClass('ads-checkbox', 'g-item');
      expect(rootOf(name).querySelector('.ads-checkbox-icon')).toHaveClass('g-icon');
      expect(rootOf(name).querySelector('.ads-checkbox-label')).toHaveClass('g-label');
    }
  });

  it('classNames: the item parts reach the checkboxes of the markup and combine with their own', () => {
    render(CheckboxGroupHarness, { props: { markup: true, classNames: { item: 'g-item', itemIcon: 'g-icon', itemLabel: 'g-label' } } });
    expect(rootOf('Apple')).toHaveClass('own-root', 'g-item');
    expect(rootOf('Apple').querySelector('.ads-checkbox-icon')).toHaveClass('own-icon', 'g-icon');
    expect(rootOf('Apple').querySelector('.ads-checkbox-label')).toHaveClass('own-label', 'g-label');
    expect(rootOf('Banana')).toHaveClass('g-item');
    expect(rootOf('Banana')).not.toHaveClass('own-root');
  });

  it('classNames: a change is applied reactively and removed when cleared', async () => {
    const { rerender } = render(CheckboxGroup, { props: { options: fruits, classNames: { item: 'a' } } });
    expect(rootOf('Apple')).toHaveClass('a');
    await rerender({ classNames: { item: 'b' } });
    expect(rootOf('Apple')).toHaveClass('b');
    expect(rootOf('Apple')).not.toHaveClass('a');
    await rerender({ classNames: undefined });
    expect(rootOf('Apple')).not.toHaveClass('b');
  });

  it('styles: root and the item parts get their inline styles; a style of the option is written after the group one', () => {
    render(CheckboxGroup, {
      props: {
        options: [{ label: 'Apple', value: 'a', style: 'opacity: 0.5' }],
        style: 'margin: 4px',
        styles: { root: { 'row-gap': '4px' }, item: { opacity: 1, 'padding-block': '2px' }, itemIcon: { 'border-radius': '50%' }, itemLabel: { 'font-weight': 600 } }
      }
    });
    expect(styleOf(group()).margin).toBe('4px');
    expect(styleOf(group()).rowGap).toBe('4px');
    expect(styleOf(rootOf('Apple')).paddingBlock).toBe('2px');
    expect(styleOf(rootOf('Apple')).opacity).toBe('0.5');
    expect(styleOf(rootOf('Apple').querySelector('.ads-checkbox-icon')).borderRadius).toBe('50%');
    expect(styleOf(rootOf('Apple').querySelector('.ads-checkbox-label')).fontWeight).toBe('600');
  });

  it('styles: without styles there is no style attribute on the group or its checkboxes', () => {
    render(CheckboxGroup, { props: { options: fruits } });
    expect(group()).not.toHaveAttribute('style');
    expect(rootOf('Apple')).not.toHaveAttribute('style');
  });

  it('native attributes: id, aria-labelledby and data-* reach the root; role belongs to the component', () => {
    const heading = document.createElement('h2');
    heading.id = 'fruits-heading';
    heading.textContent = 'Fruits';
    document.body.append(heading);
    render(CheckboxGroup, {
      props: { options: fruits, id: 'fruits', 'aria-labelledby': 'fruits-heading', 'data-testid': 'g', role: 'list' } as never
    });
    expect(group()).toHaveAttribute('id', 'fruits');
    expect(group()).toHaveAttribute('data-testid', 'g');
    expect(screen.getByRole('group', { name: 'Fruits' })).toBe(group());
    heading.remove();
  });

  // --- Forms ---

  it('forms: the name and value pairs of the checked options are submitted', async () => {
    const user = userEvent.setup();
    const form = document.createElement('form');
    document.body.append(form);
    render(CheckboxGroup, { target: form, props: { options: fruits, name: 'fruit' } });
    await user.click(box('Pear'));
    await user.click(box('Apple'));
    expect([...new FormData(form).entries()]).toEqual([
      ['fruit', 'Apple'],
      ['fruit', 'Pear']
    ]);
  });

  it('forms: a native reset does not leave the checkboxes out of step with the group value', async () => {
    vi.useFakeTimers();
    try {
      const form = document.createElement('form');
      document.body.append(form);
      render(CheckboxGroup, { target: form, props: { options: fruits, value: ['Pear'] } });
      await tick();
      form.reset();
      expect(box('Pear').checked).toBe(false);
      await vi.runAllTimersAsync();
      expect(box('Pear')).toBeChecked();
      expect(box('Apple')).not.toBeChecked();
    } finally {
      vi.useRealTimers();
    }
  });

  // --- The "check all" pattern ---

  it('check all: the control is indeterminate with a partial selection, checks all and clears all', async () => {
    const user = userEvent.setup();
    render(CheckAllHarness);
    const all = box('Check all');
    expect(all).not.toBeChecked();
    expect(all.indeterminate).toBe(true);

    await user.click(all);
    expect(screen.getByTestId('selected')).toHaveTextContent('Apple,Pear,Orange');
    expect(all).toBeChecked();
    expect(all.indeterminate).toBe(false);

    await user.click(box('Pear'));
    expect(screen.getByTestId('selected')).toHaveTextContent('Apple,Orange');
    expect(all).not.toBeChecked();
    expect(all.indeterminate).toBe(true);

    // A click on the indeterminate control checks everything, the next one clears everything.
    await user.click(all);
    expect(screen.getByTestId('selected')).toHaveTextContent('Apple,Pear,Orange');
    expect(all).toBeChecked();
    await user.click(all);
    expect(screen.getByTestId('selected').textContent).toBe('');
    expect(all).not.toBeChecked();
    expect(all.indeterminate).toBe(false);
  });

  // --- Accessibility ---

  it('a11y: a named group with checked, disabled and indeterminate items has no axe violations', async () => {
    const heading = document.createElement('h2');
    heading.id = 'fruits-heading';
    heading.textContent = 'Fruits';
    document.body.append(heading);
    const { container } = render(CheckboxGroup, {
      props: {
        options: [{ label: 'Apple', value: 'a' }, { label: 'Pear', value: 'p', disabled: true }, 'Orange'],
        value: ['a'],
        'aria-labelledby': 'fruits-heading'
      }
    });
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
    heading.remove();
  });

  it('a11y: the check all pattern has no axe violations', async () => {
    const { container } = render(CheckAllHarness);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
