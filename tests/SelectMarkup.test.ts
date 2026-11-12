// Select with SelectOption and SelectOptGroup written as children, and the server render of such a field.
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Select from '../src/lib/Select/Select.svelte';
import SelectOptGroup from '../src/lib/Select/SelectOptGroup.svelte';
import SelectOption from '../src/lib/Select/SelectOption.svelte';
import SelectMarkupHarness from './fixtures/SelectMarkupHarness.svelte';
import SelectMarkupRich from './fixtures/SelectMarkupRich.svelte';
import { combobox, listbox, named, optionNamed, options, optionTexts, part } from './selectHelpers';

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('.ads-popup').forEach((element) => element.remove());
});

const field = { ...named };

describe('Select children: SelectOption and SelectOptGroup', () => {
  it('give the options and the groups of the list, in the order they are written', async () => {
    const user = userEvent.setup();
    render(SelectMarkupHarness, { props: field });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
    expect(screen.getByRole('group')).toHaveAccessibleName('Group');
    expect(screen.getByRole('group').querySelectorAll('[role=option]')).toHaveLength(3);
  });

  it('the options exist while the list is closed: the label of the initial value shows', () => {
    render(SelectMarkupHarness, { props: { ...field, value: 'c' } });
    expect(part('item')).toHaveTextContent('Option C');
  });

  it('a click selects, and onchange gets the option object made from the props', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(SelectMarkupHarness, { props: { ...field, onchange } });
    await user.click(combobox());
    await user.click(optionNamed('Option D'));
    expect(onchange).toHaveBeenCalledWith('d', expect.objectContaining({ value: 'd', label: 'Option D' }));
    expect(part('item')).toHaveTextContent('Option D');
  });

  it('the markup that draws nothing leaves only an invisible marker in a hidden area before the field', () => {
    const { container } = render(SelectMarkupHarness, { props: field });
    const area = container.querySelector('.ads-select-registry') as HTMLElement;
    expect(area).toHaveAttribute('hidden');
    expect(area.nextElementSibling).toHaveClass('ads-select');
    expect(area.textContent?.trim()).toBe('');
    expect(area.querySelectorAll('span[hidden]').length).toBeGreaterThan(0);
  });

  it('props: label, title, class, disabled, children; the label is the text, children are what is drawn', async () => {
    const user = userEvent.setup();
    render(SelectMarkupRich, { props: field });
    await user.click(combobox());
    const [rich, titled, bare, num, inside] = options();
    expect(rich.querySelector('i')).toHaveTextContent('Rich');
    expect(rich).toHaveAttribute('title', 'A tip');
    expect(rich).toHaveClass('mine');
    expect(titled.querySelector('b')).toHaveTextContent('Bold');
    expect(bare).toHaveTextContent('bare');
    expect(num).toHaveTextContent('7');
    expect(inside).toHaveAttribute('aria-disabled', 'true');
    const group = screen.getByRole('group');
    expect(group).toHaveClass('grp');
    expect(group.querySelector('.ads-select-group-label')).toHaveAttribute('title', 'About');
  });

  it('the text of an option for the search and the type-ahead: the label, then the title, then the value', async () => {
    const user = userEvent.setup();
    render(SelectMarkupRich, { props: { ...field, showSearch: true } });
    await user.click(combobox());
    await user.keyboard('plain');
    expect(options()).toHaveLength(1);
    await user.clear(combobox());
    await user.keyboard('zeta');
    expect(options()).toHaveLength(1);
    expect(options()[0].querySelector('b')).not.toBeNull();
    await user.clear(combobox());
    await user.keyboard('bar');
    expect(options()).toHaveLength(1);
    expect(options()[0]).toHaveTextContent('bare');
  });

  it('the selected value shows the content of its option as the label text; a title-only option shows the title', () => {
    render(SelectMarkupRich, { props: { ...field, value: 'titled' } });
    expect(part('item')).toHaveTextContent('Zeta');
  });

  it('a group with no matching option is hidden while searching', async () => {
    const user = userEvent.setup();
    render(SelectMarkupHarness, { props: { ...field, showSearch: true } });
    await user.click(combobox());
    await user.keyboard('option a');
    expect(screen.queryByRole('group')).toBeNull();
    expect(optionTexts()).toEqual(['Option A']);
  });

  it('an option inserted in the middle of the markup is listed in its place, not last', async () => {
    const user = userEvent.setup();
    const { rerender } = render(SelectMarkupHarness, { props: field });
    await user.click(combobox());
    await rerender({ showMiddle: true });
    await waitFor(() => expect(optionTexts()).toEqual(['Option A', 'Middle', 'Option B', 'Option C', 'Option D']));
    await rerender({ showMiddle: false });
    await waitFor(() => expect(optionTexts()).toEqual(['Option A', 'Option B', 'Option C', 'Option D']));
  });

  it('options moved by a keyed block follow the new order; inserted and removed ones are listed and dropped', async () => {
    const user = userEvent.setup();
    const { rerender } = render(SelectMarkupHarness, { props: field });
    await user.click(combobox());
    await rerender({ keys: ['d', 'c', 'b'] });
    await waitFor(() => expect(optionTexts()).toEqual(['Option A', 'Option D', 'Option C', 'Option B']));
    await rerender({ keys: ['x', 'd'] });
    await waitFor(() => expect(optionTexts()).toEqual(['Option A', 'Option X', 'Option D']));
  });

  it('a whole group removed and written again', async () => {
    const user = userEvent.setup();
    const { rerender } = render(SelectMarkupHarness, { props: field });
    await user.click(combobox());
    await rerender({ showGroup: false });
    await waitFor(() => expect(optionTexts()).toEqual(['Option A']));
    expect(screen.queryByRole('group')).toBeNull();
    await rerender({ showGroup: true });
    await waitFor(() => expect(optionTexts()).toEqual(['Option A', 'Option B', 'Option C', 'Option D']));
  });

  it('a changed label or disabled flag of an option is read again', async () => {
    const user = userEvent.setup();
    const { rerender } = render(SelectMarkupHarness, { props: { ...field, value: 'b' } });
    await user.click(combobox());
    await rerender({ labelB: 'Renamed', disableC: true });
    expect(optionTexts()).toEqual(['Option A', 'Renamed', 'Option C', 'Option D']);
    expect(part('item')).toHaveTextContent('Renamed');
    expect(optionNamed('Option C')).toHaveAttribute('aria-disabled', 'true');
  });

  it('a non-empty options prop wins: the children are ignored and not even written', async () => {
    const user = userEvent.setup();
    const { container } = render(SelectMarkupHarness, { props: { ...field, options: ['one', 'two'] } });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['one', 'two']);
    expect(container.querySelector('.ads-select-registry')).toBeNull();
  });

  it('with an empty options prop the children are used', async () => {
    const user = userEvent.setup();
    render(SelectMarkupHarness, { props: { ...field, options: [] } });
    await user.click(combobox());
    expect(optionTexts()).toHaveLength(4);
  });

  it('a Select without children and without options has an empty list', async () => {
    const user = userEvent.setup();
    render(Select, { props: field });
    await user.click(combobox());
    expect(options()).toHaveLength(0);
    expect(listbox()).not.toBeNull();
  });

  it('written outside a Select they throw while developing and draw nothing in production', () => {
    expect(() => render(SelectOption, { props: { value: 'a' } })).toThrow('SelectOption must be written inside a Select.');
    expect(() => render(SelectOptGroup, { props: { label: 'g', children: (() => {}) as never } })).toThrow('SelectOptGroup must be written inside a Select.');
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => render(SelectOption, { props: { value: 'a' } })).not.toThrow();
    expect(() => render(SelectOptGroup, { props: { label: 'g', children: (() => {}) as never } })).not.toThrow();
  });

  it('keeps the order across renders of the same field (nothing is registered twice)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(SelectMarkupHarness, { props: field });
    await rerender({ size: 'large' });
    await rerender({ size: 'small' });
    await user.click(combobox());
    expect(optionTexts()).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
    await tick();
  });
});
