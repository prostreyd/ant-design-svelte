// Form (specs/form.md): the `<form>`, its defaults for the items, the submit flow, and the store that belongs to it.
// jsdom has no layout: the geometry, the real colours and the animation are in e2e/form.spec.ts.
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createForm } from '../src/lib/Form/store.svelte.js';
import type { FormInstance } from '../src/lib/Form/types.js';
import FormBindHarness from './fixtures/FormBindHarness.svelte';
import FormHarness from './fixtures/FormHarness.svelte';
import FormNativeHarness from './fixtures/FormNativeHarness.svelte';
import FormPassHarness from './fixtures/FormPassHarness.svelte';
import FormPlainHarness from './fixtures/FormPlainHarness.svelte';
import FormProbeHarness from './fixtures/FormProbeHarness.svelte';
import FormSwapHarness from './fixtures/FormSwapHarness.svelte';
import FormProbe from './fixtures/FormProbe.svelte';

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const formElement = () => document.querySelector('form') as HTMLFormElement;
const username = () => screen.getByRole('textbox', { name: 'Username' }) as HTMLInputElement;
const submit = () => screen.getByRole('button', { name: 'Submit' });
const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));

describe('FORM-1: the element', () => {
  it('draws a <form> with novalidate and the classes of its layout', () => {
    render(FormHarness);
    expect(formElement()).toBeInTheDocument();
    expect(formElement()).toHaveAttribute('novalidate');
    expect(appClasses(formElement())).toEqual(['ads-form', 'ads-form-horizontal']);
  });

  it('novalidate={false} gives the native validation back', () => {
    render(FormHarness, { props: { formProps: { novalidate: false } } });
    expect(formElement()).not.toHaveAttribute('novalidate');
  });

  it('passes native attributes, class and style through', () => {
    render(FormHarness, { props: { formProps: { id: 'my-form', 'aria-label': 'Sign in', class: 'mine', style: 'max-width: 300px' } } });
    expect(formElement()).toHaveAttribute('id', 'my-form');
    expect(formElement()).toHaveAttribute('aria-label', 'Sign in');
    expect(formElement()).toHaveClass('mine');
    expect(formElement().style.maxWidth).toBe('300px');
  });

  it('a native submit never navigates', () => {
    render(FormHarness);
    const event = new Event('submit', { bubbles: true, cancelable: true });
    formElement().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('a form that has a name or not: the form with the layout vertical and inline has its class', () => {
    const { unmount } = render(FormHarness, { props: { formProps: { layout: 'vertical' } } });
    expect(formElement()).toHaveClass('ads-form-vertical');
    unmount();
    render(FormHarness, { props: { formProps: { layout: 'inline' } } });
    expect(formElement()).toHaveClass('ads-form-inline');
  });

  it('a layout outside the contract throws while developing and falls back in production', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(FormHarness, { props: { formProps: { layout: 'diagonal' as never } } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(FormHarness, { props: { formProps: { layout: 'diagonal' as never } } });
    expect(formElement()).toHaveClass('ads-form-horizontal');
  });
});

describe('FORM-2: the submit flow', () => {
  it('a submit that passes calls onfinish with the values of the fields', async () => {
    const log: unknown[] = [];
    const user = userEvent.setup();
    render(FormHarness, { props: { log } });
    await user.type(username(), 'ann');
    await user.click(submit());
    await waitFor(() => expect(log).toEqual([['finish', { username: 'ann', remember: true }]]));
  });

  it('a submit that fails calls onfinishfailed with the failing fields, and never onfinish', async () => {
    const log: unknown[] = [];
    const user = userEvent.setup();
    render(FormHarness, { props: { log } });
    await user.click(submit());
    await waitFor(() => expect(log).toEqual([['failed', ['username']]]));
  });

  it('the failure carries the values, the errors and outOfDate', async () => {
    const info: unknown[] = [];
    const user = userEvent.setup();
    render(FormHarness, { props: { formProps: { onfinishfailed: (failure) => info.push(failure) } } });
    await user.click(submit());
    await waitFor(() => expect(info).toHaveLength(1));
    expect(info[0]).toEqual({
      values: { username: '', remember: true },
      errorFields: [{ name: ['username'], errors: ['Please input your username'], warnings: [] }],
      outOfDate: false
    });
  });

  it('Enter in a field submits the form', async () => {
    const log: unknown[] = [];
    const user = userEvent.setup();
    render(FormHarness, { props: { log } });
    await user.type(username(), 'ann{Enter}');
    await waitFor(() => expect(log).toEqual([['finish', { username: 'ann', remember: true }]]));
  });

  it('form.submit() does what the button does', async () => {
    const log: unknown[] = [];
    const form = createForm();
    render(FormHarness, { props: { log, form } });
    form.submit();
    await waitFor(() => expect(log).toEqual([['failed', ['username']]]));
  });

  it('a callback that is replaced later is the one that is called', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(FormHarness, { props: { formProps: { onfinish: first } } });
    await rerender({ formProps: { onfinish: second } });
    await user.type(username(), 'a');
    await user.click(submit());
    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
    expect(first).not.toHaveBeenCalled();
  });

  it('an error thrown by onfinish is not taken for a failed validation', async () => {
    const user = userEvent.setup();
    const failures = vi.fn();
    const unhandled: unknown[] = [];
    const capture = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', capture);
    render(FormHarness, {
      props: {
        formProps: {
          onfinish: () => {
            throw new Error('boom');
          },
          onfinishfailed: failures
        }
      }
    });
    await user.type(username(), 'a');
    await user.click(submit());
    await waitFor(() => expect(unhandled).toHaveLength(1));
    process.off('unhandledRejection', capture);
    expect(String(unhandled[0])).toContain('boom');
    expect(failures).not.toHaveBeenCalled();
  });
});

describe('FORM-2: an error that is not a failed validation', () => {
  it('a bug in the validation reaches the caller and is not reported as a failed submit', async () => {
    const form = createForm();
    const failures = vi.fn();
    const unhandled: unknown[] = [];
    const capture = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', capture);
    vi.spyOn(form, 'validateFields').mockRejectedValue(new Error('the library broke'));
    render(FormHarness, { props: { form, formProps: { onfinishfailed: failures } } });
    form.submit();
    await waitFor(() => expect(unhandled).toHaveLength(1));
    process.off('unhandledRejection', capture);
    expect(String(unhandled[0])).toContain('the library broke');
    expect(failures).not.toHaveBeenCalled();
  });
});

describe('FORM-2 and Q4: a failed submit focuses the first invalid control', () => {
  it('by default: scrolls it into view and focuses it', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    await user.click(submit());
    await waitFor(() => expect(document.activeElement).toBe(username()));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('true scrolls only (the React meaning)', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { formProps: { scrollToFirstError: true } } });
    await user.click(submit());
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(document.activeElement).not.toBe(username());
  });

  it('an object without focus scrolls only, and passes the native options', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { formProps: { scrollToFirstError: { behavior: 'smooth', block: 'center' } } } });
    await user.click(submit());
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' }));
    expect(document.activeElement).not.toBe(username());
  });

  it('false moves nothing', async () => {
    const user = userEvent.setup();
    render(FormHarness, { props: { formProps: { scrollToFirstError: false } } });
    await user.click(submit());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(submit());
  });

  it('focus is not moved by a validation that is not a submit', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    await user.type(username(), 'a');
    await user.clear(username());
    await screen.findByText('Please input your username');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('FORM-6: ids', () => {
  it('the ids of the controls start with the name of the form', () => {
    render(FormHarness);
    expect(username()).toHaveAttribute('id', 't_username');
  });

  it('forms without a name get unique ids, so equal field names never share an id', () => {
    render(FormHarness, { props: { formProps: { name: undefined } } });
    render(FormHarness, { props: { formProps: { name: undefined } } });
    const ids = screen.getAllByRole('textbox').map((input) => input.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id) => id.endsWith('_username'))).toBe(true);
  });
});

describe('FORM-5: defaults for the items', () => {
  it('colon={false} on the form removes the colon of every label, and an item can put it back', () => {
    render(FormPlainHarness, { props: { formProps: { colon: false }, itemProps: { colon: true }, second: {} } });
    const labels = screen.getAllByText(/^(One|Two)$/);
    expect(labels[0]).toHaveClass('ads-form-item-label-colon');
    expect(labels[1]).not.toHaveClass('ads-form-item-label-colon');
  });

  it('labelAlign and labelWrap of the form reach the items, and an item overrides them', () => {
    render(FormPlainHarness, { props: { formProps: { labelAlign: 'start', labelWrap: true }, second: { labelAlign: 'end', labelWrap: false } } });
    const boxes = document.querySelectorAll('.ads-form-item-label-box');
    expect(boxes[0]).toHaveClass('ads-form-item-label-start', 'ads-form-item-label-wrap');
    expect(boxes[1]).toHaveClass('ads-form-item-label-end');
    expect(boxes[1]).not.toHaveClass('ads-form-item-label-wrap');
  });
});

describe('FORM-8 and the callbacks', () => {
  it('onvalueschange gets the change of the user, onfieldschange the state of the field', async () => {
    const changes: unknown[] = [];
    const fields: unknown[] = [];
    const user = userEvent.setup();
    render(FormHarness, {
      props: {
        formProps: {
          onvalueschange: (changed, all) => changes.push([changed, all]),
          onfieldschange: (changed) => fields.push(changed[0].name.join('.'))
        }
      }
    });
    await user.type(username(), 'a');
    expect(changes).toEqual([[{ username: 'a' }, { username: 'a', remember: true }]]);
    expect(fields.length).toBeGreaterThan(0);
    expect(new Set(fields)).toEqual(new Set(['username']));
  });
});

describe('FORM-9 and FORM-10: the store', () => {
  it('<Form bind:form> returns the store the form made', () => {
    let received: FormInstance | undefined;
    render(FormBindHarness, { props: { onform: (form) => (received = form) } });
    expect(received).toBeDefined();
    expect(received!.getFieldValue('a')).toBe(1);
  });

  it('a store that is passed is the one that is used', () => {
    const form = createForm();
    render(FormHarness, { props: { form } });
    expect(form.getFieldsValue()).toEqual({ username: '', remember: true });
  });

  it('replacing the store while mounted moves the items to the new one', async () => {
    const first = createForm();
    const second = createForm();
    const user = userEvent.setup();
    render(FormSwapHarness, { props: { first, second } });
    expect(first.getFieldsValue()).toEqual({ name: 'start' });
    expect(second.getFieldsValue()).toEqual({});
    await user.click(screen.getByRole('button', { name: 'swap' }));
    await waitFor(() => expect(second.getFieldsValue()).toEqual({ name: 'start' }));
    expect(first.getFieldsValue()).toEqual({});
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
    expect(second.getFieldValue('name')).toBe('start!');
    expect(first.getFieldValue('name')).toBe('start');
  });

  it('initialValues fill the controls at the first render', () => {
    render(FormHarness, { props: { formProps: { initialValues: { username: 'ann', remember: false } } } });
    expect(username()).toHaveValue('ann');
  });

  it('initialValues are not reactive: a later change of the prop does not change the values', async () => {
    const { rerender } = render(FormHarness, { props: { formProps: { initialValues: { username: 'ann', remember: true } } } });
    await rerender({ formProps: { initialValues: { username: 'bob', remember: true } } });
    expect(username()).toHaveValue('ann');
  });
});

describe('STORE-12: getFormInstance', () => {
  it('gives the store of the nearest Form to a component inside it', () => {
    const form = createForm();
    let got: FormInstance | undefined;
    render(FormProbeHarness, { props: { form, onprobe: (found) => (got = found) } });
    expect(got).toBe(form);
  });

  it('throws outside a Form, with a message that says what to do', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(FormProbe, { props: { onprobe: () => {} } })).toThrow(/inside a <Form>/);
  });
});

describe('STORE-11: a field with no initial value', () => {
  it('warns once, in development, with the name of the field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(FormNativeHarness);
    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((text) => text.includes('"username"'))).toHaveLength(1);
    expect(messages.some((text) => text.includes('initialValues'))).toBe(true);
  });

  it('is quiet when the form or the item gives a value, and quiet in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(FormNativeHarness, { props: { formProps: { initialValues: { username: '' } } } });
    expect(warn).not.toHaveBeenCalled();
    vi.stubEnv('NODE_ENV', 'production');
    render(FormNativeHarness);
    expect(warn).not.toHaveBeenCalled();
  });

  it('a control with a default of its own fails loudly when bound to a missing value (the reason for the warning)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(FormHarness, { props: { formProps: { initialValues: {} } } })).toThrow(/props_invalid_value|fallback/);
  });
});

describe('FORM-11: disabled, size and variant reach the control through field', () => {
  it('the control gets them when it is given them', () => {
    render(FormPassHarness, { props: { formProps: { disabled: true, size: 'large', variant: 'filled' } } });
    const input = screen.getByRole('textbox', { name: 'A' });
    expect(input).toBeDisabled();
    expect(input.closest('.ads-input')).toHaveClass('ads-input-large', 'ads-input-filled');
  });

  it('Form changes no control by itself', () => {
    render(FormPassHarness, { props: { formProps: { disabled: true, size: 'large', variant: 'filled' }, pass: false } });
    const input = screen.getByRole('textbox', { name: 'A' });
    expect(input).not.toBeDisabled();
    expect(input.closest('.ads-input')).not.toHaveClass('ads-input-large');
  });

  it('without the props the field says undefined, so the control keeps its own state', () => {
    render(FormPassHarness);
    const input = screen.getByRole('textbox', { name: 'A' });
    expect(input).not.toBeDisabled();
    expect(input.closest('.ads-input')).toHaveClass('ads-input-medium');
  });

  it('a change of the prop reaches the control', async () => {
    const { rerender } = render(FormPassHarness, { props: { formProps: { disabled: false } } });
    await rerender({ formProps: { disabled: true } });
    expect(screen.getByRole('textbox', { name: 'A' })).toBeDisabled();
  });
});

describe('a11y', () => {
  const OPTIONS = {
    runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } }
  };

  it('has no serious or critical violation: at rest, and with an error shown', async () => {
    const user = userEvent.setup();
    render(FormHarness);
    const rest = await axe.run(document.body, OPTIONS);
    expect(rest.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    await user.click(submit());
    await screen.findByText('Please input your username');
    const failed = await axe.run(document.body, OPTIONS);
    expect(failed.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
});
