// `model` and the form-level `rules` of a Form (specs/form.md, revision R), in the DOM.
// The store logic with a model is in tests/formModelStore.test.ts; here the controls, the markup and the props.
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createForm } from '../src/lib/Form/store.svelte.js';
import type { FormInstance } from '../src/lib/Form/types.js';
import FormModelHarness from './fixtures/FormModelHarness.svelte';
import { reactive } from './helpers/model.svelte.js';

interface Profile {
  username: string;
  user: { city: string };
  confirm: string;
}

const profile = (): Profile => ({ username: 'a', user: { city: 'x' }, confirm: '' });
const box = (name: string) => screen.getByRole('textbox', { name }) as HTMLInputElement;
const submit = () => screen.getByRole('button', { name: 'Submit' });
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const changes = (log: unknown[]) => log.filter((entry) => (entry as unknown[])[0] === 'change');
const marks = (label: string) => box(label).closest('.ads-form-item')!.querySelectorAll('.ads-form-item-mark').length;

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('MODEL-1 in the DOM: the controls read and write the model', () => {
  it('a control that binds the field writes the model, which keeps its identity', async () => {
    const model = reactive(profile());
    const original = model;
    render(FormModelHarness, { props: { model, direct: false } });
    await userEvent.setup().type(box('Username'), 'bc');
    expect(model.username).toBe('abc');
    expect(model).toBe(original);
  });

  it('a change of the model in code shows in the control', async () => {
    const model = reactive(profile());
    render(FormModelHarness, { props: { model, direct: false } });
    model.username = 'from code';
    model.user.city = 'Osh';
    await waitFor(() => expect(box('Username')).toHaveValue('from code'));
    expect(box('City')).toHaveValue('Osh');
  });
});

describe('MODEL-2 and MODEL-3 in the DOM: a control that binds the model is a user', () => {
  it('validates on change, marks the field touched and tells onvalueschange', async () => {
    const model = reactive(profile());
    const log: unknown[] = [];
    render(FormModelHarness, { props: { model, log, itemProps: { rules: [{ min: 3, message: 'too short' }] } } });
    await userEvent.setup().type(box('Username'), 'b');
    expect(model.username).toBe('ab');
    expect(await screen.findByText('too short')).toBeInTheDocument();
    expect(changes(log)).toHaveLength(1);
    expect(changes(log)[0]).toEqual(['change', { username: 'ab' }, { username: 'ab', user: { city: 'x' }, confirm: '' }]);
    await userEvent.setup().type(box('Username'), 'c');
    await waitFor(() => expect(screen.queryByText('too short')).toBeNull());
  });

  it('an assignment in code is the same as typing', async () => {
    const model = reactive(profile());
    const log: unknown[] = [];
    render(FormModelHarness, { props: { model, log, itemProps: { rules: [{ min: 3, message: 'too short' }] } } });
    model.username = 'zz';
    expect(await screen.findByText('too short')).toBeInTheDocument();
    expect(changes(log)).toHaveLength(1);
  });

  it('a control that binds the field reports a keystroke once', async () => {
    const model = reactive(profile());
    const log: unknown[] = [];
    render(FormModelHarness, { props: { model, log, direct: false } });
    await userEvent.setup().type(box('Username'), 'b');
    await settle();
    expect(changes(log)).toHaveLength(1);
  });

  it('the methods of the instance are not user changes', async () => {
    const model = reactive(profile());
    const log: unknown[] = [];
    const form = createForm<Profile>();
    render(FormModelHarness, { props: { model, form, log, itemProps: { rules: [{ min: 3, message: 'too short' }] } } });
    form.setFieldValue('username', 'q');
    form.setFieldsValue({ user: { city: 'Talas' } });
    await waitFor(() => expect(box('City')).toHaveValue('Talas'));
    await settle();
    expect(box('Username')).toHaveValue('q');
    expect(changes(log)).toHaveLength(0);
    expect(screen.queryByText('too short')).toBeNull();
  });
});

describe('MODEL-5 and MODEL-6 in the DOM: initial values and reset', () => {
  it('initialValues fill only the keys the model lacks, so every control has a value', () => {
    const model = reactive({ username: 'mine' } as Profile);
    render(FormModelHarness, { props: { model } });
    expect(box('Username')).toHaveValue('mine');
    expect(model.user.city).toBe('');
    expect(model.confirm).toBe('');
  });

  it('resetFields puts the model back as it was at mount, in the same object', async () => {
    const model = reactive(profile());
    const form = createForm<Profile>();
    render(FormModelHarness, { props: { model, form } });
    await userEvent.setup().type(box('Username'), 'zzz');
    form.resetFields();
    await waitFor(() => expect(box('Username')).toHaveValue('a'));
    expect(model).toEqual(profile());
  });
});

describe('MODEL-7 in the DOM: what onfinish gets is a copy', () => {
  it('is the values of the fields, not the model itself', async () => {
    const model = reactive(profile());
    const log: unknown[] = [];
    render(FormModelHarness, { props: { model, log } });
    await userEvent.setup().click(submit());
    await waitFor(() => expect(log.some((entry) => (entry as unknown[])[0] === 'finish')).toBe(true));
    const [, values] = log.find((entry) => (entry as unknown[])[0] === 'finish') as [string, Profile];
    expect(values).toEqual(profile());
    expect(values).not.toBe(model);
    expect(values.user).not.toBe(model.user);
  });
});

describe('MODEL-8 in the DOM: a replaced model', () => {
  it('the form reads the new object and nothing is reported; reset returns to the first snapshot', async () => {
    const first = reactive(profile());
    const second = reactive({ ...profile(), username: 'second' });
    const form = createForm<Profile>();
    const log: unknown[] = [];
    const { rerender } = render(FormModelHarness, { props: { model: first, form, log } });
    await rerender({ model: second });
    await waitFor(() => expect(form.getFieldValue('username')).toBe('second'));
    expect(box('Username')).toHaveValue('second');
    await settle();
    expect(changes(log)).toHaveLength(0);
    await userEvent.setup().type(box('Username'), '!');
    expect(second.username).toBe('second!');
    expect(first.username).toBe('a');
    form.resetFields();
    expect(second.username).toBe('a');
  });

  it('a model that is taken away leaves the values with the store, which writes to them from then on', async () => {
    const model = reactive(profile());
    const form = createForm<Profile>();
    const { rerender } = render(FormModelHarness, { props: { model, form } });
    await rerender({ model: undefined });
    await waitFor(() => expect(box('Username')).toHaveValue('a'));
    form.setFieldValue('username', 'own');
    expect(form.getFieldValue('username')).toBe('own');
    expect(model.username).toBe('a');
  });
});

describe('MODEL-9 in the DOM: preserve', () => {
  it('an item that is destroyed with preserve false takes its key out of the model', async () => {
    const model = reactive(profile());
    const { rerender } = render(FormModelHarness, { props: { model, preserveCity: false } });
    await rerender({ showCity: false });
    await waitFor(() => expect('city' in model.user).toBe(false));
  });

  it('with preserve true the key stays', async () => {
    const model = reactive(profile());
    const { rerender } = render(FormModelHarness, { props: { model } });
    await rerender({ showCity: false });
    await settle();
    expect(model.user.city).toBe('x');
  });
});

describe('FRULES-1: the rules of the form apply by name', () => {
  it('a list per name, and nested objects for nested names', async () => {
    const log: unknown[] = [];
    render(FormModelHarness, {
      props: {
        log,
        rules: {
          username: [{ required: true, message: 'form says username' }],
          user: { city: [{ required: true, message: 'form says city' }] }
        }
      }
    });
    await userEvent.setup().click(submit());
    expect(await screen.findByText('form says username')).toBeInTheDocument();
    expect(screen.getByText('form says city')).toBeInTheDocument();
    expect(log).toContainEqual(['failed', ['username', 'user.city']]);
  });
});

describe('FRULES-2: the rules of the item are added after the rules of the form', () => {
  it('both run, the form first', async () => {
    render(FormModelHarness, {
      props: {
        rules: { username: [{ min: 3, message: 'form min' }] },
        itemProps: { rules: [{ required: true, message: 'item required' }] }
      }
    });
    const user = userEvent.setup();
    await user.type(box('Username'), 'ab');
    expect(await screen.findByText('form min')).toBeInTheDocument();
    await user.clear(box('Username'));
    expect(await screen.findByText('item required')).toBeInTheDocument();
  });

  it('a required rule of the form gives the mark and aria-required, as a rule of the item does', () => {
    render(FormModelHarness, { props: { rules: { username: [{ required: true }] } } });
    expect(marks('Username')).toBe(1);
    expect(box('Username')).toHaveAttribute('aria-required', 'true');
    expect(marks('Confirm')).toBe(0);
    expect(box('Confirm')).not.toHaveAttribute('aria-required');
  });
});

describe('FRULES-3: a changed rules prop is used', () => {
  it('updates the mark, and the next validation uses the new rules', async () => {
    const log: unknown[] = [];
    const { rerender } = render(FormModelHarness, { props: { log } });
    expect(marks('Username')).toBe(0);
    await rerender({ rules: { username: [{ required: true, message: 'now required' }] } });
    expect(marks('Username')).toBe(1);
    await userEvent.setup().click(submit());
    expect(await screen.findByText('now required')).toBeInTheDocument();
  });

  it('a rule that is a function gets the instance', async () => {
    const seen: FormInstance<Profile>[] = [];
    const form = createForm<Profile>();
    render(FormModelHarness, {
      props: {
        form,
        rules: {
          confirm: [
            (instance: FormInstance<Profile>) => {
              seen.push(instance);
              return {
                validator: (_rule: unknown, value: string) =>
                  value === instance.getFieldValue('username') ? undefined : Promise.reject(new Error('must match'))
              };
            }
          ]
        }
      }
    });
    await userEvent.setup().type(box('Confirm'), 'q');
    expect(await screen.findByText('must match')).toBeInTheDocument();
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((instance) => instance === form)).toBe(true);
  });
});

describe('FRULES-4: only a list at the end of the path is a list of rules', () => {
  it('an entry that is an object for a flat name, or a list met halfway, gives no rules', async () => {
    const log: unknown[] = [];
    render(FormModelHarness, {
      props: {
        log,
        rules: {
          username: { deeper: [{ required: true, message: 'never' }] },
          user: [{ required: true, message: 'never either' }]
        }
      }
    });
    await userEvent.setup().click(submit());
    await waitFor(() => expect(log.some((entry) => (entry as unknown[])[0] === 'finish')).toBe(true));
    expect(screen.queryByText('never')).toBeNull();
    expect(screen.queryByText('never either')).toBeNull();
    expect(marks('Username')).toBe(0);
  });
});
