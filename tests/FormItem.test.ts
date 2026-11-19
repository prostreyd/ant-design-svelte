// FormItem (specs/form.md): one row of a form, its label, control, messages and status.
// jsdom has no layout: the geometry, the real colours and the animation are in e2e/form.spec.ts.
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createForm } from '../src/lib/Form/store.svelte.js';
import FormConfirmHarness from './fixtures/FormConfirmHarness.svelte';
import FormFeedbackHarness from './fixtures/FormFeedbackHarness.svelte';
import FormFieldHarness from './fixtures/FormFieldHarness.svelte';
import FormHarness from './fixtures/FormHarness.svelte';
import FormItemAlone from './fixtures/FormItemAlone.svelte';
import FormNoNameHarness from './fixtures/FormNoNameHarness.svelte';
import FormPlainHarness from './fixtures/FormPlainHarness.svelte';

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const text = (value: string) => createRawSnippet(() => ({ render: () => `<b>${value}</b>` }));
const username = () => screen.getByRole('textbox', { name: 'Username' }) as HTMLInputElement;
const submit = () => screen.getByRole('button', { name: 'Submit' });
const item = (index = 0) => document.querySelectorAll<HTMLElement>('.ads-form-item')[index];
const labelOf = (index = 0) => item(index).querySelector<HTMLLabelElement>('label')!;
/** What a reader of the label hears: its text without the parts that are `aria-hidden` (the star and the colon). */
const spoken = (element: Element) => {
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((part) => part.remove());
  return copy.textContent?.replace(/\s+/g, ' ').trim();
};
const helpOf = (index = 0) => item(index).querySelector<HTMLElement>('.ads-form-item-help')!;
const colFor = (element: Element) => element.closest('.ads-col') as HTMLElement;
/** Svelte leaves empty text and comment nodes behind, so an element is empty when it has no child element and no text. */
const isEmpty = (element: Element) => element.children.length === 0 && !element.textContent?.trim();
const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));

describe('ITEM-1: the structure', () => {
  it('is a Row of the library with a label column and a control column', () => {
    render(FormPlainHarness);
    expect(appClasses(item())).toEqual(['ads-form-item', 'ads-form-item-horizontal']);
    const row = item().querySelector('.ads-row');
    expect(row).toHaveClass('ads-form-item-row');
    const columns = row!.querySelectorAll(':scope > .ads-col');
    expect(columns).toHaveLength(2);
    expect(columns[0].querySelector('label')).toHaveTextContent('One');
    expect(columns[1]).toContainElement(screen.getByTestId('content-one'));
  });

  it('labelCol and wrapperCol are the props of Col: below 576 px the label stacks on the control, from 576 px they are as asked', () => {
    render(FormPlainHarness, { props: { formProps: { labelCol: { span: 6 }, wrapperCol: { span: 18 } } } });
    const label = colFor(labelOf()).getAttribute('style')!;
    const control = colFor(screen.getByTestId('content-one')).getAttribute('style')!;
    expect(label).toContain('--ads-col-span-xs: 24');
    expect(label).toContain('--ads-col-span-sm: 6');
    expect(control).toContain('--ads-col-span-xs: 24');
    expect(control).toContain('--ads-col-span-sm: 18');
  });

  it('a user who gives xs to a column takes the narrow layout over', () => {
    render(FormPlainHarness, { props: { formProps: { labelCol: { xs: 24, sm: 6 }, wrapperCol: { xs: 24, sm: 18 } } } });
    const label = colFor(labelOf()).getAttribute('style')!;
    expect(label).toContain('--ads-col-span-xs: 24');
    expect(label).toContain('--ads-col-span-sm: 6');
  });

  it('an item value of labelCol wins over the form value', () => {
    render(FormPlainHarness, { props: { formProps: { labelCol: { span: 6 } }, itemProps: { labelCol: { span: 3 } } } });
    expect(colFor(labelOf()).getAttribute('style')).toContain('--ads-col-span-sm: 3');
  });

  it('a control column with no span takes the room that is left; offset is kept', () => {
    render(FormPlainHarness, { props: { itemProps: { wrapperCol: { offset: 4 } } } });
    const control = colFor(screen.getByTestId('content-one')).getAttribute('style')!;
    expect(control).toContain('--ads-col-flex-sm: 1 1 0%');
    expect(control).toContain('--ads-col-offset-sm: 4');
    expect(control).toContain('--ads-col-offset-xs: 0');
  });

  it('vertical layout: the label above the control, the columns do not share a line, labelCol.offset is kept', () => {
    render(FormPlainHarness, { props: { formProps: { layout: 'vertical', labelCol: { span: 4, offset: 2 }, wrapperCol: { span: 8 } } } });
    expect(item()).toHaveClass('ads-form-item-vertical');
    const label = colFor(labelOf()).getAttribute('style')!;
    expect(label).toContain('--ads-col-offset-xs: 2');
    expect(label).toContain('--ads-col-flex-xs: 0 0 auto');
    expect(label).not.toContain('--ads-col-span');
    expect(item().querySelector('.ads-row')!.getAttribute('style')).toContain('flex-direction: column');
  });

  it('inline layout: each column is as wide as its content', () => {
    render(FormPlainHarness, { props: { formProps: { layout: 'inline' } } });
    expect(item()).toHaveClass('ads-form-item-inline');
    expect(colFor(labelOf()).getAttribute('style')).toContain('--ads-col-flex-xs: none');
  });

  it('a layout on one item: a vertical item in a horizontal form', () => {
    render(FormPlainHarness, { props: { itemProps: { layout: 'vertical' }, second: {} } });
    expect(item(0)).toHaveClass('ads-form-item-vertical');
    expect(item(1)).toHaveClass('ads-form-item-horizontal');
  });

  it('a layout outside the contract throws while developing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(FormPlainHarness, { props: { itemProps: { layout: 'inline' as never } } })).toThrow(RangeError);
  });

  it('no label prop, no label column; label={null} keeps it, empty', () => {
    const { unmount } = render(FormPlainHarness, { props: { itemProps: { label: undefined } } });
    expect(item().querySelector('label')).toBeNull();
    expect(item().querySelectorAll(':scope .ads-row > .ads-col')).toHaveLength(1);
    unmount();
    render(FormPlainHarness, { props: { itemProps: { label: null } } });
    // no text, but the column is there and the colon still lines it up with the other labels
    expect(spoken(labelOf())).toBe('');
    expect(item().querySelectorAll(':scope .ads-row > .ads-col')).toHaveLength(2);
  });

  it('the label, help and extra draw a number 0, not nothing', () => {
    render(FormPlainHarness, { props: { itemProps: { label: 0 as never, help: 0 as never, extra: 0 as never } } });
    expect(spoken(labelOf())).toBe('0');
    expect(item().querySelector('.ads-form-item-help-item')).toHaveTextContent('0');
    expect(item().querySelector('.ads-form-item-extra')).toHaveTextContent('0');
  });

  it('the label can be a snippet', () => {
    render(FormPlainHarness, { props: { itemProps: { label: text('Rich label') } } });
    expect(labelOf().querySelector('b')).toHaveTextContent('Rich label');
  });

  it('native attributes, class and style go to the root', () => {
    render(FormPlainHarness, { props: { itemProps: { id: 'row-1', class: 'mine', style: 'margin-top: 3px', 'data-x': '1' } as never } });
    expect(item()).toHaveAttribute('id', 'row-1');
    expect(item()).toHaveAttribute('data-x', '1');
    expect(item()).toHaveClass('mine');
    expect(item().style.marginTop).toBe('3px');
  });
});

describe('ITEM-2: ids and the label', () => {
  it('the control id is <form name>_<field>, and the label points at it', () => {
    render(FormHarness);
    expect(username()).toHaveAttribute('id', 't_username');
    expect(labelOf()).toHaveAttribute('for', 't_username');
  });

  it('a nested name joins its steps', () => {
    const form = createForm();
    render(FormHarness, { props: { form, itemProps: { name: ['user', 'name'] }, formProps: { initialValues: { user: { name: '' }, remember: true } } } });
    expect(username()).toHaveAttribute('id', 't_user_name');
  });

  it('htmlFor sets the for of the label, and null removes it', () => {
    const { unmount } = render(FormHarness, { props: { itemProps: { htmlFor: 'elsewhere' } } });
    expect(labelOf()).toHaveAttribute('for', 'elsewhere');
    unmount();
    render(FormHarness, { props: { itemProps: { htmlFor: null } } });
    expect(labelOf()).not.toHaveAttribute('for');
    // the name stays: the control is still labelled, only the click on the label does not reach it
    expect(username()).toHaveAttribute('aria-labelledby', 't_username_label');
  });

  it('an item with no name has an id of its own for its parts', () => {
    render(FormPlainHarness);
    expect(helpOf().id).toMatch(/_help$/);
  });
});

describe('ITEM-3: the label, the colon and the mark', () => {
  it('the label is a <label>; the star and the colon are aria-hidden, so what is read is the text only', () => {
    render(FormHarness);
    expect(labelOf().tagName).toBe('LABEL');
    expect(spoken(labelOf())).toBe('Username');
    expect(labelOf().querySelector('.ads-form-item-mark')).toHaveAttribute('aria-hidden', 'true');
    expect(labelOf().querySelector('.ads-form-item-mark')).toHaveTextContent('*');
    expect(labelOf().querySelector('.ads-form-item-colon')).toHaveAttribute('aria-hidden', 'true');
    expect(labelOf().querySelector('.ads-form-item-colon')).toHaveTextContent(':');
    expect(labelOf()).toHaveClass('ads-form-item-label-colon', 'ads-form-item-label-after');
  });

  it('the control is named by the text of the label only', () => {
    render(FormHarness);
    expect(screen.getByRole('textbox', { name: 'Username' })).toBe(username());
  });

  it('the colon is for the horizontal layout only, and colon={false} keeps the room after the label', () => {
    const { unmount } = render(FormPlainHarness, { props: { formProps: { layout: 'vertical' } } });
    expect(labelOf()).not.toHaveClass('ads-form-item-label-colon');
    expect(labelOf()).not.toHaveClass('ads-form-item-label-after');
    expect(labelOf().querySelector('.ads-form-item-colon')).toBeNull();
    unmount();
    const inline = render(FormPlainHarness, { props: { formProps: { layout: 'inline' } } });
    expect(labelOf()).not.toHaveClass('ads-form-item-label-colon');
    expect(labelOf()).toHaveClass('ads-form-item-label-after');
    inline.unmount();
    render(FormPlainHarness, { props: { itemProps: { colon: false } } });
    expect(labelOf()).not.toHaveClass('ads-form-item-label-colon');
    expect(labelOf()).toHaveClass('ads-form-item-label-after');
    // the room is kept: a no-break space stands where the colon would be
    expect(labelOf().querySelector('.ads-form-item-colon')!.textContent).toBe('\u00a0');
  });
});

describe('ITEM-4: the required mark', () => {
  it('the star follows a required rule', () => {
    render(FormHarness);
    expect(labelOf()).toHaveClass('ads-form-item-label-required');
    expect(labelOf(1)).not.toHaveClass('ads-form-item-label-required');
  });

  it('required={false} hides it even with a required rule, and required={true} shows it without one', () => {
    const { unmount } = render(FormHarness, { props: { itemProps: { required: false } } });
    expect(labelOf()).not.toHaveClass('ads-form-item-label-required');
    unmount();
    render(FormPlainHarness, { props: { itemProps: { required: true } } });
    expect(labelOf()).toHaveClass('ads-form-item-label-required');
  });

  it('a rule given as a function counts', () => {
    render(FormPlainHarness, { props: { itemProps: { rules: [() => ({ required: true })] } } });
    expect(labelOf()).toHaveClass('ads-form-item-label-required');
  });

  it('requiredMark={false} on the form hides every star', () => {
    render(FormHarness, { props: { formProps: { requiredMark: false } } });
    expect(labelOf()).not.toHaveClass('ads-form-item-label-required');
  });

  it("requiredMark 'optional' writes (optional) as text after the labels of the items that are not required", () => {
    render(FormHarness, { props: { formProps: { requiredMark: 'optional' } } });
    expect(labelOf()).not.toHaveClass('ads-form-item-label-required');
    expect(labelOf()).not.toHaveTextContent('(optional)');
    expect(spoken(labelOf(1))).toBe('Remember (optional)');
  });

  it('requiredMark as a snippet draws the label itself, with the label and the state', () => {
    const mark = createRawSnippet((info: () => { label: unknown; required: boolean }) => ({
      render: () => `<em>${String(info().label)}${info().required ? ' *required*' : ''}</em>`
    }));
    render(FormHarness, { props: { formProps: { requiredMark: mark } } });
    expect(labelOf().querySelector('em')).toHaveTextContent('Username *required*');
    expect(labelOf(1).querySelector('em')).toHaveTextContent('Remember');
    expect(labelOf()).not.toHaveClass('ads-form-item-label-required');
    expect(labelOf().querySelector('.ads-form-item-mark')).toBeNull();
    // the colon still follows a label the consumer draws
    expect(labelOf().querySelector('.ads-form-item-colon')).toBeInTheDocument();
  });
});

describe('ITEM-5: the tooltip', () => {
  const icon = () => screen.getByRole('button', { name: 'More information' });

  it('a help icon after the label: a button outside the label, so it is not part of its name', () => {
    render(FormPlainHarness, { props: { itemProps: { tooltip: 'Help text' } } });
    expect(icon()).toHaveClass('ads-form-item-tooltip');
    expect(labelOf()).not.toContainElement(icon());
    expect(spoken(labelOf())).toBe('One');
  });

  it('opens the library Tooltip on focus, with the text, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(FormPlainHarness, { props: { itemProps: { tooltip: 'Help text' } } });
    await user.tab();
    expect(icon()).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Help text'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('the object form takes the props of Tooltip, the icon and its accessible name', () => {
    render(FormPlainHarness, { props: { itemProps: { tooltip: { title: 'Tip', icon: '?', iconLabel: 'Aide', placement: 'bottom' } } } });
    expect(screen.getByRole('button', { name: 'Aide' })).toHaveTextContent('?');
  });

  it('the icon can be a snippet, and the title too', () => {
    render(FormPlainHarness, { props: { itemProps: { tooltip: { title: text('Rich'), icon: text('i') } } } });
    expect(icon().querySelector('b')).toHaveTextContent('i');
  });

  it('the tooltip of the form is the default of every item, and an item overrides it', () => {
    render(FormPlainHarness, { props: { formProps: { tooltip: { iconLabel: 'Info', icon: '!' } }, itemProps: { tooltip: 'One tip' }, second: { tooltip: { title: 'Two tip', icon: '?' } } } });
    const infos = screen.getAllByRole('button', { name: 'Info' });
    expect(infos).toHaveLength(2);
    expect(infos[0]).toHaveTextContent('!');
    expect(infos[1]).toHaveTextContent('?');
  });

  it('no tooltip, no icon', () => {
    render(FormPlainHarness);
    expect(screen.queryByRole('button', { name: 'More information' })).toBeNull();
  });
});

describe('ITEM-6: hidden', () => {
  it('hides the item but still collects and validates the field', async () => {
    const user = userEvent.setup();
    const form = createForm();
    const log: unknown[] = [];
    render(FormHarness, { props: { form, log, itemProps: { hidden: true } } });
    expect(item()).toHaveClass('ads-form-item-hidden');
    expect(form.getFieldsValue()).toHaveProperty('username', '');
    await user.click(submit());
    await waitFor(() => expect(log).toEqual([['failed', ['username']]]));
  });
});

describe('ITEM-7: the status', () => {
  it('error after a failed validation, and back to nothing when it passes', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    await user.click(submit());
    await waitFor(() => expect(item()).toHaveClass('ads-form-item-has-error', 'ads-form-item-with-help'));
    await user.type(username(), 'a');
    await waitFor(() => expect(item()).not.toHaveClass('ads-form-item-has-error'));
    expect(item()).not.toHaveClass('ads-form-item-with-help');
  });

  it('the control gets the status: an error draws the error look and aria-invalid', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    await user.click(submit());
    await waitFor(() => expect(username().closest('.ads-input')).toHaveClass('ads-input-status-error'));
    expect(username()).toHaveAttribute('aria-invalid', 'true');
  });

  it('a warning-only failure is a warning: the warning look, and no aria-invalid', async () => {
    const user = userEvent.setup();
    const log: unknown[] = [];
    render(FormHarness, { props: { log, itemProps: { rules: [{ required: true, message: 'soft', warningOnly: true }] } } });
    await user.click(submit());
    await waitFor(() => expect(item()).toHaveClass('ads-form-item-has-warning'));
    expect(username().closest('.ads-input')).toHaveClass('ads-input-status-warning');
    expect(username()).not.toHaveAttribute('aria-invalid');
    expect(screen.getByText('soft')).toHaveClass('ads-form-item-help-item-warning');
    await waitFor(() => expect(log).toEqual([['finish', { username: '', remember: true }]]));
  });

  it('validating while a rule runs, then the result', async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    const slow = { validator: () => new Promise<void>((resolve) => (release = resolve)) };
    render(FormHarness, { props: { itemProps: { rules: [slow] } } });
    await user.type(username(), 'a');
    await waitFor(() => expect(item()).toHaveClass('ads-form-item-has-validating'));
    release();
    await waitFor(() => expect(item()).not.toHaveClass('ads-form-item-has-validating'));
  });

  it('success only with hasFeedback, after a validation without messages', async () => {
    const user = userEvent.setup();
    const { unmount } = render(FormHarness);
    await user.type(username(), 'a');
    await waitFor(() => expect(isEmpty(helpOf())).toBe(true));
    expect(item()).not.toHaveClass('ads-form-item-has-success');
    unmount();
    render(FormHarness, { props: { itemProps: { hasFeedback: true } } });
    await userEvent.setup().type(username(), 'a');
    await waitFor(() => expect(item()).toHaveClass('ads-form-item-has-success'));
  });

  it('validateStatus sets the status by hand and wins over the validation', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { validateStatus: 'warning' } } });
    expect(item()).toHaveClass('ads-form-item-has-warning');
    await user.click(submit());
    await screen.findByText('Please input your username');
    expect(item()).toHaveClass('ads-form-item-has-warning');
    expect(item()).not.toHaveClass('ads-form-item-has-error');
  });
});

describe('ITEM-8: the messages', () => {
  it('each failing rule is a line, errors first, then warnings', async () => {
    const user = userEvent.setup();
    render(FormHarness, {
      props: {
        itemProps: {
          rules: [
            { min: 5, message: 'at least 5' },
            { pattern: /^\d+$/, message: 'digits' },
            { min: 9, message: 'a warning', warningOnly: true }
          ]
        }
      }
    });
    await user.type(username(), 'ab');
    await waitFor(() => expect([...helpOf().children].map((line) => line.textContent)).toEqual(['at least 5', 'digits', 'a warning']));
    expect(helpOf().children[0]).toHaveClass('ads-form-item-help-item-error');
    expect(helpOf().children[2]).toHaveClass('ads-form-item-help-item-warning');
  });

  it('help replaces the generated messages, as text or a snippet', async () => {
    const user = userEvent.setup();
    const { unmount } = render(FormHarness, { props: { itemProps: { help: 'Use 4 to 16 characters.' } } });
    expect(helpOf()).toHaveTextContent('Use 4 to 16 characters.');
    await user.click(submit());
    await waitFor(() => expect(item()).toHaveClass('ads-form-item-has-error'));
    expect(screen.queryByText('Please input your username')).toBeNull();
    expect(helpOf().firstElementChild).toHaveClass('ads-form-item-help-item-error');
    unmount();
    render(FormPlainHarness, { props: { itemProps: { help: text('Rich help') } } });
    expect(helpOf().querySelector('b')).toHaveTextContent('Rich help');
  });

  it('help={false} shows no message, with the item in error', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { help: false } } });
    await user.click(submit());
    await waitFor(() => expect(username()).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.queryByText('Please input your username')).toBeNull();
    expect(isEmpty(helpOf())).toBe(true);
  });

  it('extra is a hint below the messages, text or a snippet, always shown', async () => {
    const user = userEvent.setup();
    const { unmount } = render(FormHarness, { props: { itemProps: { extra: 'We will not share it.' } } });
    const extra = () => item().querySelector('.ads-form-item-extra')!;
    expect(extra()).toHaveTextContent('We will not share it.');
    await user.click(submit());
    await screen.findByText('Please input your username');
    expect(extra()).toBeInTheDocument();
    expect(helpOf().compareDocumentPosition(extra()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    unmount();
    render(FormPlainHarness, { props: { itemProps: { extra: text('Rich extra') } } });
    expect(item().querySelector('.ads-form-item-extra b')).toHaveTextContent('Rich extra');
  });

  it('the space of the messages is the margin of the item: the item says so with a class', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    const additional = () => item().querySelector('.ads-form-item-additional')!;
    expect(additional()).not.toHaveClass('ads-form-item-additional-on');
    await user.click(submit());
    await waitFor(() => expect(additional()).toHaveClass('ads-form-item-additional-on'));
  });

  it('messageVariables reach the message templates', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { rules: [{ required: true, message: '${what} is needed' }], messageVariables: { what: 'The name' } } } });
    await user.click(submit());
    expect(await screen.findByText('The name is needed')).toBeInTheDocument();
  });

  it('the label is the ${name} of a generated message, and the field name when the label is not text', async () => {
    const user = userEvent.setup();
    const { unmount } = render(FormHarness, { props: { itemProps: { rules: [{ required: true }] } } });
    await user.click(submit());
    expect(await screen.findByText("'Username' is required")).toBeInTheDocument();
    unmount();
    render(FormHarness, { props: { itemProps: { label: text('Rich'), rules: [{ required: true }] } } });
    await userEvent.setup().click(submit());
    expect(await screen.findByText("'username' is required")).toBeInTheDocument();
  });
});

describe('ITEM-9: hasFeedback', () => {
  const feedback = () => document.querySelector('.ads-form-feedback');

  it('gives the control an icon for its suffix, one shape per status', async () => {
    const user = userEvent.setup();
    render(FormFeedbackHarness, { props: { itemProps: { rules: [{ required: true, message: 'x' }] } } });
    expect(feedback()).toBeNull();
    await user.type(screen.getByRole('textbox', { name: 'A' }), 'a');
    await waitFor(() => expect(feedback()).toHaveClass('ads-form-feedback-success'));
    await user.clear(screen.getByRole('textbox', { name: 'A' }));
    await waitFor(() => expect(feedback()).toHaveClass('ads-form-feedback-error'));
    expect(feedback()).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the validating icon while a rule runs', async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    render(FormFeedbackHarness, { props: { itemProps: { rules: [{ validator: () => new Promise<void>((resolve) => (release = resolve)) }] } } });
    await user.type(screen.getByRole('textbox', { name: 'A' }), 'a');
    await waitFor(() => expect(feedback()).toHaveClass('ads-form-feedback-validating'));
    release();
    await waitFor(() => expect(feedback()).toHaveClass('ads-form-feedback-success'));
  });

  it('a validateStatus of your own gets its icon at once', () => {
    render(FormFeedbackHarness, { props: { itemProps: { validateStatus: 'warning' } } });
    expect(feedback()).toHaveClass('ads-form-feedback-warning');
  });

  it('the icons can be replaced per status, on the item or on the form, the item first', () => {
    render(FormFeedbackHarness, {
      props: {
        formProps: { feedbackIcons: { error: text('form-error'), warning: text('form-warning') } },
        itemProps: { validateStatus: 'error', hasFeedback: { icons: { error: text('item-error') } } }
      }
    });
    expect(document.body).toHaveTextContent('item-error');
    expect(document.body).not.toHaveTextContent('form-error');
  });

  it('the form icons are used when the item gives none', () => {
    render(FormFeedbackHarness, { props: { formProps: { feedbackIcons: { warning: text('form-warning') } }, itemProps: { validateStatus: 'warning' } } });
    expect(document.body).toHaveTextContent('form-warning');
  });

  it('nothing is drawn unless the consumer places field.feedback, and without hasFeedback it is undefined', () => {
    render(FormHarness, { props: { itemProps: { hasFeedback: true, validateStatus: 'error' } } });
    expect(feedback()).toBeNull();
  });
});

describe('ITEM-10: the semantic parts', () => {
  it('classNames and styles of the form reach the six parts of every item', async () => {
    const user = userEvent.setup();
    const names = ['root', 'label', 'content', 'help', 'helpItem', 'extra'] as const;
    const classNames = Object.fromEntries(names.map((name) => [name, `my-${name}`]));
    const styles = Object.fromEntries(names.map((name) => [name, { 'outline-color': 'red' }]));
    render(FormHarness, { props: { formProps: { classNames, styles }, itemProps: { extra: 'x' } } });
    await user.click(submit());
    await screen.findByText('Please input your username');
    expect(item()).toHaveClass('my-root');
    expect(item().querySelector('.my-label')).toBe(labelOf());
    expect(item().querySelector('.my-content')).toContainElement(username());
    expect(item().querySelector('.my-help')).toBe(helpOf());
    expect(item().querySelector('.my-helpItem')).toBe(helpOf().firstElementChild);
    expect(item().querySelector('.my-extra')).toBeInTheDocument();
    for (const name of names) {
      const part = name === 'root' ? item() : (item().querySelector(`.my-${name}`) as HTMLElement);
      expect(part.style.outlineColor).toBe('red');
    }
  });
});

describe('the field object: errors, warnings, validating and touched', () => {
  const state = (name: string) => JSON.parse(screen.getByTestId(`${name}-state`).textContent!) as Record<string, unknown>;

  it('start empty, and after a failed submit carry the messages of their own field', async () => {
    const user = userEvent.setup();
    render(FormFieldHarness);
    expect(state('first')).toEqual({ errors: [], warnings: [], validating: false, touched: false });
    await user.click(screen.getByRole('button', { name: 'Go' }));
    await waitFor(() => expect(state('second').errors).toEqual(['second needed']));
    expect(state('first')).toEqual({ errors: ['first needed'], warnings: ['first soft'], validating: false, touched: false });
    // the failing fields were found in the order of the page, so the focus went to the first
    expect(screen.getByRole('textbox', { name: 'first' })).toHaveFocus();
  });

  it('touched after a change by the user', async () => {
    const user = userEvent.setup();
    render(FormFieldHarness);
    await user.type(screen.getByRole('textbox', { name: 'second' }), 'x');
    expect(state('second').touched).toBe(true);
    expect(state('first').touched).toBe(false);
  });
});

describe('ITEM-11: an item with no name, in every part of it', () => {
  it('a snippet reads undefined and its writes go nowhere; composition and blur events do nothing', async () => {
    const user = userEvent.setup();
    render(FormNoNameHarness);
    const input = screen.getByTestId('free-input') as HTMLInputElement;
    expect(screen.getByTestId('free-value')).toHaveTextContent('undefined');
    await user.type(input, 'abc');
    await fireEvent.compositionStart(input);
    await fireEvent.compositionEnd(input);
    await user.tab();
    expect(screen.getByTestId('free-value')).toHaveTextContent('undefined');
    expect(input.getAttribute('id')).toBe(item(0).querySelector('label')!.getAttribute('for'));
  });

  it('an item with no children draws its label and an empty control box', () => {
    render(FormNoNameHarness);
    expect(spoken(labelOf(1))).toBe('Empty');
    expect(isEmpty(item(1).querySelector('.ads-form-item-content')!)).toBe(true);
  });
});

describe('ITEM-4 and ITEM-8: the remaining paths of an item', () => {
  it('validateTrigger of an item can be a list', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { validateTrigger: ['change', 'blur'] } } });
    await user.click(username());
    await user.tab();
    expect(await screen.findByText('Please input your username')).toBeInTheDocument();
  });

  it('a help text takes the colour of a warning status, and is neutral without a status', () => {
    const { unmount } = render(FormPlainHarness, { props: { itemProps: { help: 'Careful', validateStatus: 'warning' } } });
    expect(helpOf().firstElementChild).toHaveClass('ads-form-item-help-item-warning');
    unmount();
    render(FormPlainHarness, { props: { itemProps: { help: 'Plain' } } });
    expect(helpOf().firstElementChild).toHaveClass('ads-form-item-help-item-help');
  });

  it('a control of an item with no label text has no aria-labelledby: an empty label would take its own name away', () => {
    const { unmount } = render(FormHarness, { props: { itemProps: { label: undefined } } });
    expect(screen.getAllByRole('textbox')[0]).not.toHaveAttribute('aria-labelledby');
    unmount();
    render(FormHarness, { props: { itemProps: { label: null } } });
    expect(screen.getAllByRole('textbox')[0]).not.toHaveAttribute('aria-labelledby');
    expect(spoken(labelOf())).toBe('');
  });

  it('a requiredMark snippet gets an item with a null label as null', () => {
    const mark = createRawSnippet((info: () => { label: unknown; required: boolean }) => ({
      render: () => `<em>${info().label === null ? 'no label' : 'label'}</em>`
    }));
    render(FormHarness, { props: { formProps: { requiredMark: mark }, itemProps: { label: null } } });
    expect(labelOf().querySelector('em')).toHaveTextContent('no label');
  });
});

describe('ITEM-11 and ITEM-12', () => {
  it('an item with no name is a layout row: it registers no field', () => {
    const form = createForm();
    render(FormPlainHarness, { props: { formProps: { form }, itemProps: {} } });
    expect(form.getFieldsValue()).toEqual({});
  });

  it('an item outside a Form is a plain row', () => {
    render(FormItemAlone);
    expect(item()).toHaveClass('ads-form-item-horizontal');
    expect(labelOf()).toHaveTextContent('Alone');
    expect(screen.getByTestId('alone')).toBeInTheDocument();
  });

  it('a name that changes moves the item to the other field', async () => {
    const form = createForm();
    const { rerender } = render(FormHarness, {
      props: { form, formProps: { initialValues: { username: 'one', other: 'two', remember: true } } }
    });
    expect(username()).toHaveValue('one');
    await rerender({ itemProps: { name: 'other' } });
    expect(username()).toHaveValue('two');
    expect(Object.keys(form.getFieldsValue())).toContain('other');
    expect(Object.keys(form.getFieldsValue())).not.toContain('username');
  });

  it('an initialValue of the item is the value when the form has none, and the form wins', () => {
    const { unmount } = render(FormHarness, { props: { formProps: { initialValues: { remember: true } }, itemProps: { initialValue: 'from item' } } });
    expect(username()).toHaveValue('from item');
    unmount();
    render(FormHarness, { props: { formProps: { initialValues: { username: 'from form', remember: true } }, itemProps: { initialValue: 'from item' } } });
    expect(username()).toHaveValue('from form');
  });
});

describe('VAL-1 and VAL-2 in the DOM', () => {
  it('validates on change by default: the message appears while typing and goes away', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    await user.type(username(), 'a');
    await user.clear(username());
    expect(await screen.findByText('Please input your username')).toBeInTheDocument();
    await user.type(username(), 'b');
    await waitFor(() => expect(screen.queryByText('Please input your username')).toBeNull());
  });

  it("validateTrigger 'blur': nothing while typing, the message when the control loses focus", async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { validateTrigger: 'blur' } } });
    await user.click(username());
    await user.type(username(), 'a');
    await user.clear(username());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText('Please input your username')).toBeNull();
    await user.tab();
    expect(await screen.findByText('Please input your username')).toBeInTheDocument();
  });

  it('the form validateTrigger is the default of its items', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { formProps: { validateTrigger: ['blur'] } } });
    await user.click(username());
    await user.tab();
    expect(await screen.findByText('Please input your username')).toBeInTheDocument();
  });

  it('focus that stays inside the control box is not a blur', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { validateTrigger: 'blur', rules: [{ required: true, message: 'm' }] } } });
    const input = username();
    await user.click(input);
    // moving focus between two elements of the same box (here: from the input to itself through the box) is not a blur
    const box = input.closest('.ads-form-item-content')!;
    await fireEvent.focusOut(input, { relatedTarget: box.querySelector('input') });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText('m')).toBeNull();
  });

  it('IME: a message does not appear under a half-typed composition, it appears when the composition ends', async () => {
    render(FormHarness, { props: { itemProps: { rules: [{ min: 3, message: 'too short' }] } } });
    const input = username();
    await fireEvent.compositionStart(input);
    await fireEvent.input(input, { target: { value: 'n' } });
    await fireEvent.input(input, { target: { value: 'ni' } });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(screen.queryByText('too short')).toBeNull();
    await fireEvent.compositionEnd(input);
    expect(await screen.findByText('too short')).toBeInTheDocument();
  });

  it('IME: a composition that ends on a good value shows no message', async () => {
    render(FormHarness, { props: { itemProps: { rules: [{ min: 3, message: 'too short' }] } } });
    const input = username();
    await fireEvent.compositionStart(input);
    await fireEvent.input(input, { target: { value: 'n' } });
    await fireEvent.input(input, { target: { value: 'nihao' } });
    await fireEvent.compositionEnd(input);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(screen.queryByText('too short')).toBeNull();
  });
});

describe('VAL-8 in the DOM: dependencies', () => {
  it('the second password is checked again when the first one changes', async () => {
    const user = userEvent.setup();
    render(FormConfirmHarness);
    const [password, confirm] = screen.getAllByRole('textbox') as HTMLInputElement[];
    await user.type(password, 'secret');
    await user.type(confirm, 'sec');
    expect(await screen.findByText('The passwords do not match')).toBeInTheDocument();
    await user.clear(confirm);
    await user.type(confirm, 'secret');
    await waitFor(() => expect(screen.queryByText('The passwords do not match')).toBeNull());
    await user.type(password, 'X');
    expect(await screen.findByText('The passwords do not match')).toBeInTheDocument();
  });

  it('an untouched dependent field shows nothing when the first one changes', async () => {
    const user = userEvent.setup();
    render(FormConfirmHarness);
    const [password] = screen.getAllByRole('textbox');
    await user.type(password, 'a');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(screen.queryByText('confirm needed')).toBeNull();
  });
});

describe('a11y', () => {
  const OPTIONS = {
    runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } }
  };

  it('the control is named by the label, linked to its messages, and marked required', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    expect(username()).toHaveAttribute('aria-required', 'true');
    expect(username()).not.toHaveAttribute('aria-describedby');
    expect(username()).not.toHaveAttribute('aria-invalid');
    await user.click(submit());
    await screen.findByText('Please input your username');
    expect(username()).toHaveAttribute('aria-describedby', 't_username_help');
    expect(username()).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('t_username_help')).toHaveTextContent('Please input your username');
    expect(screen.getByRole('textbox', { name: 'Username' })).toBe(username());
  });

  it('describedby lists the extra hint after the messages, and only ids that exist', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { extra: 'a hint' } } });
    expect(username()).toHaveAttribute('aria-describedby', 't_username_extra');
    await user.click(submit());
    await screen.findByText('Please input your username');
    expect(username()).toHaveAttribute('aria-describedby', 't_username_help t_username_extra');
    for (const id of username().getAttribute('aria-describedby')!.split(' ')) expect(document.getElementById(id)).not.toBeNull();
  });

  it('a warning is described but is not invalid', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { itemProps: { rules: [{ required: true, message: 'soft', warningOnly: true }] } } });
    await user.click(submit());
    await screen.findByText('soft');
    expect(username()).toHaveAttribute('aria-describedby', 't_username_help');
    expect(username()).not.toHaveAttribute('aria-invalid');
  });

  it('the messages area is neither an alert nor a live region (a screen reader reads it when the control gets focus)', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    await user.click(submit());
    await screen.findByText('Please input your username');
    expect(helpOf()).not.toHaveAttribute('role');
    expect(helpOf()).not.toHaveAttribute('aria-live');
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('a hidden item is out of the accessibility tree and the tab order', () => {
    render(FormHarness, { props: { itemProps: { hidden: true } } });
    expect(item()).toHaveClass('ads-form-item-hidden');
    // jsdom does not apply the stylesheet of a component, so the rule behind the class is checked in the browser tests
  });

  it('has no serious or critical violation with a tooltip, an extra hint, messages and feedback', async () => {
    const user = userEvent.setup();
    render(FormFeedbackHarness, { props: { itemProps: { rules: [{ required: true, message: 'm' }], tooltip: 'tip', extra: 'hint' } } });
    await user.type(screen.getByRole('textbox', { name: 'A' }), 'a');
    await user.clear(screen.getByRole('textbox', { name: 'A' }));
    await screen.findByText('m');
    const result = await axe.run(document.body, OPTIONS);
    expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
});
