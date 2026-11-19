import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pathText, toPath } from '../src/lib/Form/path.js';
import { createForm, type FieldEntry, type FormStore } from '../src/lib/Form/store.svelte.js';
import type { FormFinishFailedInfo, FormNamePath, FormRuleConfig, FormValidateTrigger } from '../src/lib/Form/types.js';
import { track } from './helpers/track.svelte.js';

interface EntryOptions {
  rules?: FormRuleConfig[];
  triggers?: FormValidateTrigger[];
  first?: boolean | 'parallel';
  debounce?: number;
  deps?: FormNamePath[];
  preserve?: boolean;
  container?: HTMLElement | null;
  controlId?: string;
}

/** What an item would tell the store, as a plain object, so the store can be tested without a component. */
function entry(name: FormNamePath, options: EntryOptions = {}) {
  const path = toPath(name);
  const state = { composing: false };
  const item: FieldEntry = {
    id: Symbol(pathText(path)),
    path: () => path,
    rules: () => options.rules ?? [],
    triggers: () => options.triggers ?? ['change'],
    validateFirst: () => options.first ?? false,
    debounce: () => options.debounce,
    dependencies: () => (options.deps ?? []).map(toPath),
    variables: () => ({ name: pathText(path) }),
    preserve: () => options.preserve ?? true,
    composing: () => state.composing,
    controlId: () => options.controlId ?? `id-${pathText(path)}`,
    container: () => options.container ?? null
  };
  return { item, state };
}

const required: FormRuleConfig = { required: true, message: 'needed' };

function mounted(names: Record<string, EntryOptions> = {}, initial: Record<string, unknown> = {}) {
  const form = createForm();
  form.init(initial);
  // A key with commas is a path: 'user,age' is ['user', 'age'].
  const items = Object.fromEntries(
    Object.entries(names).map(([name, options]) => [name, entry(name.includes(',') ? name.split(',') : name, options)])
  );
  for (const { item } of Object.values(items)) form.register(item);
  return { form, items };
}

/** Lets the promises of a validation run: with fake timers by advancing them, otherwise by waiting a moment. */
const settle = async () => {
  if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
  else await new Promise((resolve) => setTimeout(resolve, 5));
  await Promise.resolve();
};

afterEach(() => {
  vi.useRealTimers();
});

/** Reads what the store says about a field after the asynchronous validation has settled. */
const failure = async (form: FormStore, names?: FormNamePath[]): Promise<FormFinishFailedInfo> => {
  try {
    await form.validateFields(names);
  } catch (info) {
    return info as FormFinishFailedInfo;
  }
  throw new Error('the validation passed');
};

describe('STORE-1: reactive reads', () => {
  it('a read in an effect runs again when the value changes, and only then', () => {
    const { form } = mounted({ a: {}, b: {} }, { a: 1, b: 1 });
    const reads = track(() => form.getFieldValue('a'));
    expect(reads.values).toEqual([1]);
    form.setFieldValue('b', 2);
    flushSync();
    expect(reads.values).toEqual([1]);
    form.setFieldValue('a', 5);
    flushSync();
    expect(reads.values).toEqual([1, 5]);
    reads.stop();
  });

  it('a nested value is reactive by its path', () => {
    const { form } = mounted({}, { user: { name: 'a', age: 1 } });
    const name = track(() => form.getFieldValue(['user', 'name']));
    form.setFieldValue(['user', 'age'], 2);
    flushSync();
    expect(name.values).toEqual(['a']);
    form.setFieldValue(['user', 'name'], 'b');
    flushSync();
    expect(name.values).toEqual(['a', 'b']);
    name.stop();
  });

  it('the messages and the flags are reactive', async () => {
    const { form } = mounted({ a: { rules: [required] } }, { a: '' });
    const errors = track(() => form.getFieldError('a').join('|'));
    await failure(form);
    flushSync();
    expect(errors.values.at(-1)).toBe('needed');
    errors.stop();
  });

  it('getFieldsValue() follows the set of items that are mounted', () => {
    const form = createForm();
    form.init({ a: 1, b: 2 });
    const all = track(() => Object.keys(form.getFieldsValue()).join(','));
    expect(all.values).toEqual(['']);
    const a = entry('a');
    const unregister = form.register(a.item);
    flushSync();
    expect(all.values.at(-1)).toBe('a');
    unregister();
    flushSync();
    expect(all.values.at(-1)).toBe('');
    all.stop();
  });
});

describe('STORE-3: initial values and reset', () => {
  it('init gives the values, and a value that is already set is kept', () => {
    const form = createForm();
    form.setFieldValue('a', 'mine');
    form.init({ a: 'initial', b: 'initial' });
    expect(form.getFieldValue('a')).toBe('mine');
    expect(form.getFieldValue('b')).toBe('initial');
  });

  it('the initial values are copied, so a later change of the object does not reach the store', () => {
    const initial = { user: { name: 'a' } };
    const form = createForm();
    form.init(initial);
    initial.user.name = 'changed';
    expect(form.getFieldValue(['user', 'name'])).toBe('a');
  });

  it('an item initialValue is used when the form has none, and the form wins when it has one', () => {
    const form = createForm();
    form.init({ b: 'form' });
    form.setItemInitial(['a'], 'item');
    form.setItemInitial(['b'], 'item');
    expect(form.getFieldValue('a')).toBe('item');
    expect(form.getFieldValue('b')).toBe('form');
  });

  it('resetFields() returns every value to its initial one and clears touched, errors and warnings', async () => {
    const { form, items } = mounted({ a: { rules: [required] }, b: {} }, { a: 'x', b: 'y' });
    form.setItemInitial(['c'], 'item-c');
    form.userChange(items.a.item, '');
    form.userChange(items.b.item, 'changed');
    await failure(form);
    form.setFieldValue('c', 'other');
    form.resetFields();
    expect(form.getFieldsValue(true)).toEqual({ a: 'x', b: 'y', c: 'item-c' });
    expect(form.isFieldTouched('a')).toBe(false);
    expect(form.getFieldError('a')).toEqual([]);
  });

  it('resetFields(names) resets those fields only, and removes a field that has no initial value', () => {
    const { form, items } = mounted({ a: {}, b: {}, extra: {} }, { a: 'x', b: 'y' });
    form.userChange(items.a.item, 'changed-a');
    form.userChange(items.b.item, 'changed-b');
    form.userChange(items.extra.item, 'new');
    form.resetFields(['a', 'extra']);
    expect(form.getFieldValue('a')).toBe('x');
    expect(form.getFieldValue('b')).toBe('changed-b');
    expect(form.getFieldValue('extra')).toBeUndefined();
    expect(form.isFieldTouched('a')).toBe(false);
    expect(form.isFieldTouched('b')).toBe(true);
  });
});

describe('STORE-4: setting values from code', () => {
  it('setFieldValue clears the messages of the field, runs no validation and calls no callback', async () => {
    const { form, items } = mounted({ a: { rules: [required] } }, { a: '' });
    const onvalueschange = vi.fn();
    form.bind({ onvalueschange });
    await failure(form);
    expect(form.getFieldError('a')).toEqual(['needed']);
    const validator = vi.fn();
    const watcher = entry('w', { rules: [{ validator }] });
    form.register(watcher.item);
    form.setFieldValue('a', 'filled');
    expect(form.getFieldError('a')).toEqual([]);
    expect(form.getFieldValue('a')).toBe('filled');
    expect(onvalueschange).not.toHaveBeenCalled();
    expect(validator).not.toHaveBeenCalled();
    void items;
  });

  it('setFieldsValue merges deeply, keeps the other fields, and clears the messages of the fields it reaches', async () => {
    const { form } = mounted(
      { name: { rules: [required] }, 'user,age': {} },
      { name: '', user: { age: 1, city: 'Oslo' }, other: 1 }
    );
    await failure(form);
    expect(form.getFieldError('name')).toEqual(['needed']);
    form.setFieldsValue({ user: { age: 2 } });
    expect(form.getFieldsValue(true)).toEqual({ name: '', user: { age: 2, city: 'Oslo' }, other: 1 });
    expect(form.getFieldError('name')).toEqual(['needed']);
    form.setFieldsValue({ name: 'filled' });
    expect(form.getFieldError('name')).toEqual([]);
  });

  it('setFieldValue also cancels a validation that is still running', async () => {
    vi.useFakeTimers();
    const slow = { validator: () => new Promise<void>((_, reject) => setTimeout(() => reject('late'), 50)) };
    const { form, items } = mounted({ a: { rules: [slow] } }, { a: 'x' });
    form.userChange(items.a.item, 'y');
    await settle();
    expect(form.isFieldValidating('a')).toBe(true);
    form.setFieldValue('a', 'z');
    await vi.advanceTimersByTimeAsync(100);
    expect(form.getFieldError('a')).toEqual([]);
  });
});

describe('STORE-5: getFieldsValue', () => {
  const build = () => mounted({ a: {}, 'b,c': {} }, { a: 1, b: { c: 2, d: 3 }, loose: 4 });

  it('with no argument it gives the registered fields as a nested object', () => {
    const { form } = build();
    // `b.c` has an item, `b.d` and `loose` do not.
    expect(form.getFieldsValue()).toEqual({ a: 1, b: { c: 2 } });
  });

  it('true gives every value in the store, a list gives the paths in it, and the result is a copy', () => {
    const { form } = build();
    expect(form.getFieldsValue(true)).toEqual({ a: 1, b: { c: 2, d: 3 }, loose: 4 });
    expect(form.getFieldsValue(['a', ['b', 'd']])).toEqual({ a: 1, b: { d: 3 } });
    const copy = form.getFieldsValue(true) as { b: { c: number } };
    copy.b.c = 99;
    expect(form.getFieldValue(['b', 'c'])).toBe(2);
  });

  it('a filter keeps the fields it accepts, given alone or as the second argument', () => {
    const { form, items } = mounted({ a: {}, b: {} }, { a: 1, b: 2 });
    form.userChange(items.a.item, 10);
    expect(form.getFieldsValue({ filter: (meta) => meta.touched })).toEqual({ a: 10 });
    expect(form.getFieldsValue(undefined, { filter: (meta) => !meta.touched })).toEqual({ b: 2 });
  });
});

describe('STORE-6: the flags and the messages of a field', () => {
  it('touched after a user change, and not after a value set from code', () => {
    const { form, items } = mounted({ a: {}, b: {} }, { a: '', b: '' });
    form.userChange(items.a.item, 'x');
    form.setFieldValue('b', 'y');
    expect(form.isFieldTouched('a')).toBe(true);
    expect(form.isFieldTouched('b')).toBe(false);
  });

  it('isFieldsTouched: any, all, and none for an empty list of fields', () => {
    const { form, items } = mounted({ a: {}, b: {} }, { a: '', b: '' });
    expect(form.isFieldsTouched()).toBe(false);
    form.userChange(items.a.item, 'x');
    expect(form.isFieldsTouched()).toBe(true);
    expect(form.isFieldsTouched(['a', 'b'], true)).toBe(false);
    form.userChange(items.b.item, 'x');
    expect(form.isFieldsTouched(['a', 'b'], true)).toBe(true);
    expect(createForm().isFieldsTouched()).toBe(false);
  });

  it('getFieldsError lists every field with its errors and warnings', async () => {
    const { form } = mounted(
      { a: { rules: [required, { required: true, message: 'soft', warningOnly: true }] }, b: {} },
      { a: '', b: 'ok' }
    );
    await failure(form);
    expect(form.getFieldsError()).toEqual([
      { name: ['a'], errors: ['needed'], warnings: ['soft'] },
      { name: ['b'], errors: [], warnings: [] }
    ]);
    expect(form.getFieldWarning('a')).toEqual(['soft']);
    expect(form.getFieldsError(['b'])).toEqual([{ name: ['b'], errors: [], warnings: [] }]);
  });

  it('isFieldValidating is true while a rule runs', async () => {
    vi.useFakeTimers();
    const slow = { validator: () => new Promise<void>((resolve) => setTimeout(resolve, 50)) };
    const { form } = mounted({ a: { rules: [slow] } }, { a: 'x' });
    const pending = form.validateFields();
    await settle();
    expect(form.isFieldValidating('a')).toBe(true);
    await vi.advanceTimersByTimeAsync(60);
    await pending;
    expect(form.isFieldValidating('a')).toBe(false);
  });

  it('setFields sets the value and the state of fields', () => {
    const { form } = mounted({ a: {} }, { a: '' });
    form.setFields([{ name: ['a'], value: 'v', touched: true, errors: ['e'], warnings: ['w'] }]);
    expect(form.getFieldValue('a')).toBe('v');
    expect(form.isFieldTouched('a')).toBe(true);
    expect(form.getFieldError('a')).toEqual(['e']);
    expect(form.getFieldWarning('a')).toEqual(['w']);
    form.setFields([{ name: ['a'], errors: [] }]);
    expect(form.getFieldError('a')).toEqual([]);
    expect(form.getFieldValue('a')).toBe('v');
  });
});

describe('STORE-7: validateFields', () => {
  it('resolves with the values of the registered fields', async () => {
    const { form } = mounted({ a: { rules: [required] }, b: {} }, { a: 'x', b: 'y', loose: 1 });
    await expect(form.validateFields()).resolves.toEqual({ a: 'x', b: 'y' });
  });

  it('rejects with the values, the failing fields and outOfDate', async () => {
    const { form } = mounted({ a: { rules: [required] }, b: { rules: [required] }, c: {} }, { a: '', b: 'ok', c: '' });
    const info = await failure(form);
    expect(info.errorFields).toEqual([{ name: ['a'], errors: ['needed'], warnings: [] }]);
    expect(info.values).toEqual({ a: '', b: 'ok', c: '' });
    expect(info.outOfDate).toBe(false);
  });

  it('a field with only warnings does not fail the validation', async () => {
    const { form } = mounted({ a: { rules: [{ required: true, message: 'soft', warningOnly: true }] } }, { a: '' });
    await expect(form.validateFields()).resolves.toEqual({ a: '' });
    expect(form.getFieldWarning('a')).toEqual(['soft']);
  });

  it('a list of names validates those fields, and recursive also the fields below a path', async () => {
    const { form } = mounted(
      { a: { rules: [required] }, 'u,name': { rules: [required] }, 'u,age': { rules: [required] } },
      { a: '', u: { name: '', age: '' } }
    );
    expect((await failure(form, ['a'])).errorFields.map((f) => f.name)).toEqual([['a']]);
    expect(await form.validateFields(['u']).then(() => 'ok')).toBe('ok');
    const config = { recursive: true };
    await expect(form.validateFields(['u'], config)).rejects.toMatchObject({
      errorFields: [{ name: ['u', 'name'] }, { name: ['u', 'age'] }]
    });
  });

  it('dirty validates only the fields that were touched or validated', async () => {
    const { form, items } = mounted({ a: { rules: [required] }, b: { rules: [required] } }, { a: '', b: '' });
    form.userChange(items.a.item, '');
    await settle();
    await expect(form.validateFields(undefined, { dirty: true })).rejects.toMatchObject({
      errorFields: [{ name: ['a'] }]
    });
  });

  it('validateOnly computes the result and shows nothing', async () => {
    const { form } = mounted({ a: { rules: [required] } }, { a: '' });
    await expect(form.validateFields(undefined, { validateOnly: true })).rejects.toMatchObject({
      errorFields: [{ name: ['a'], errors: ['needed'] }]
    });
    expect(form.getFieldError('a')).toEqual([]);
    expect(form.isFieldValidating('a')).toBe(false);
  });

  it('a validation that a newer one superseded says outOfDate', async () => {
    vi.useFakeTimers();
    const slow = { validator: () => new Promise<void>((_, reject) => setTimeout(() => reject('slow'), 50)) };
    const { form } = mounted({ a: { rules: [slow] } }, { a: 'x' });
    const first = form.validateFields().catch((info: FormFinishFailedInfo) => info);
    const second = form.validateFields().catch((info: FormFinishFailedInfo) => info);
    await vi.advanceTimersByTimeAsync(100);
    expect((await first).outOfDate).toBe(true);
    expect((await second).outOfDate).toBe(false);
  });

  it('a field in a list of names that has no item is skipped', async () => {
    const { form } = mounted({ a: {} }, { a: 1 });
    await expect(form.validateFields(['nothing'])).resolves.toEqual({ nothing: undefined });
  });
});

describe('VAL-1: triggers', () => {
  it('a user change validates on change, and marks the field validated with its messages', async () => {
    const { form, items } = mounted({ a: { rules: [required] } }, { a: 'x' });
    form.userChange(items.a.item, '');
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual(['needed']));
    form.userChange(items.a.item, 'filled');
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual([]));
  });

  it('a field whose triggers do not include change is not validated by a change, and is by a blur', async () => {
    const { form, items } = mounted({ a: { rules: [required], triggers: ['blur'] } }, { a: 'x' });
    form.userChange(items.a.item, '');
    await settle();
    expect(form.getFieldError('a')).toEqual([]);
    form.blur(items.a.item);
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual(['needed']));
    expect(form.isFieldTouched('a')).toBe(true);
  });

  it('a blur does nothing for a field that validates on change only', async () => {
    const { form, items } = mounted({ a: { rules: [required] } }, { a: '' });
    form.blur(items.a.item);
    await settle();
    expect(form.getFieldError('a')).toEqual([]);
    expect(form.isFieldTouched('a')).toBe(false);
  });

  it('a rule with its own trigger runs on that trigger only', async () => {
    const onBlur: FormRuleConfig = { required: true, message: 'on blur', validateTrigger: 'blur' };
    const onChange: FormRuleConfig = { min: 3, message: 'on change', validateTrigger: 'change' };
    const { form, items } = mounted({ a: { rules: [onBlur, onChange], triggers: ['change', 'blur'] } }, { a: 'x' });
    form.userChange(items.a.item, '');
    await settle();
    expect(form.getFieldError('a')).toEqual([]);
    form.userChange(items.a.item, 'ab');
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual(['on change']));
    form.userChange(items.a.item, '');
    form.blur(items.a.item);
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual(['on blur']));
  });

  it('a submit-style validation runs every rule whatever its trigger', async () => {
    const { form } = mounted({ a: { rules: [{ required: true, message: 'x', validateTrigger: 'blur' }] } }, { a: '' });
    expect((await failure(form)).errorFields).toHaveLength(1);
  });
});

describe('VAL-2: IME composition', () => {
  it('a change validation is held back while a composition is open and runs at its end with the final value', async () => {
    const validator = vi.fn();
    const { form, items } = mounted({ a: { rules: [{ min: 3, message: 'short' }, { validator }] } }, { a: '' });
    items.a.state.composing = true;
    form.userChange(items.a.item, 'n');
    form.userChange(items.a.item, 'ni');
    await settle();
    expect(form.getFieldError('a')).toEqual([]);
    expect(validator).not.toHaveBeenCalled();
    items.a.state.composing = false;
    form.userChange(items.a.item, 'nihao');
    form.compositionEnd(items.a.item);
    await vi.waitFor(() => expect(validator).toHaveBeenCalled());
    expect(validator.mock.calls.at(-1)?.[1]).toBe('nihao');
    expect(form.getFieldError('a')).toEqual([]);
  });

  it('the end of a composition validates the value it ended with', async () => {
    const { form, items } = mounted({ a: { rules: [{ min: 3, message: 'short' }] } }, { a: '' });
    items.a.state.composing = true;
    form.userChange(items.a.item, 'ni');
    items.a.state.composing = false;
    form.compositionEnd(items.a.item);
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual(['short']));
  });

  it('a composition end with nothing held back does nothing', async () => {
    const { form, items } = mounted({ a: { rules: [required] } }, { a: '' });
    form.compositionEnd(items.a.item);
    await settle();
    expect(form.getFieldError('a')).toEqual([]);
  });
});

describe('VAL-5 and VAL-7: debounce and stale results', () => {
  it('validateDebounce waits, and a newer change replaces the waiting validation', async () => {
    vi.useFakeTimers();
    const validator = vi.fn();
    const { form, items } = mounted({ a: { rules: [{ validator }], debounce: 100 } }, { a: '' });
    form.userChange(items.a.item, 'a');
    await vi.advanceTimersByTimeAsync(60);
    form.userChange(items.a.item, 'ab');
    await vi.advanceTimersByTimeAsync(60);
    expect(validator).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60);
    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator.mock.calls[0][1]).toBe('ab');
  });

  it('only the latest result reaches the field: an older, slower validation is dropped', async () => {
    vi.useFakeTimers();
    const rule: FormRuleConfig = {
      validator: (_rule, value) =>
        new Promise<void>((resolve, reject) => setTimeout(() => (value === 'bad' ? reject(`${value} is bad`) : resolve()), value === 'bad' ? 100 : 10))
    };
    const { form, items } = mounted({ a: { rules: [rule] } }, { a: '' });
    form.userChange(items.a.item, 'bad');
    await vi.advanceTimersByTimeAsync(5);
    form.userChange(items.a.item, 'good');
    await vi.advanceTimersByTimeAsync(200);
    expect(form.getFieldError('a')).toEqual([]);
    expect(form.isFieldValidating('a')).toBe(false);
  });
});

describe('VAL-8: dependencies', () => {
  const rules: FormRuleConfig[] = [{ required: true, message: 'confirm it' }];

  it('a change of a field validates the items that depend on it, when they were touched or validated', async () => {
    const { form, items } = mounted(
      { password: {}, confirm: { rules, deps: ['password'] } },
      { password: '', confirm: '' }
    );
    form.userChange(items.password.item, 'x');
    await settle();
    expect(form.getFieldError('confirm')).toEqual([]);
    form.userChange(items.confirm.item, '');
    await vi.waitFor(() => expect(form.getFieldError('confirm')).toEqual(['confirm it']));
    form.userChange(items.confirm.item, 'ok');
    await vi.waitFor(() => expect(form.getFieldError('confirm')).toEqual([]));
    form.userChange(items.confirm.item, '');
    await vi.waitFor(() => expect(form.getFieldError('confirm')).toEqual(['confirm it']));
    form.setFieldValue('confirm', 'now filled');
    form.userChange(items.password.item, 'y');
    await vi.waitFor(() => expect(form.getFieldError('confirm')).toEqual([]));
  });

  it('a value set from code triggers no dependency', async () => {
    const validator = vi.fn();
    const { form, items } = mounted(
      { password: {}, confirm: { rules: [{ validator }], deps: ['password'] } },
      { password: '', confirm: '' }
    );
    form.userChange(items.confirm.item, 'a');
    await vi.waitFor(() => expect(validator).toHaveBeenCalledTimes(1));
    form.setFieldValue('password', 'from code');
    await settle();
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('a dependency on a parent or a child path counts', async () => {
    const { form, items } = mounted(
      { 'user,name': {}, summary: { rules, deps: ['user'] } },
      { user: { name: '' }, summary: '' }
    );
    form.userChange(items.summary.item, '');
    await vi.waitFor(() => expect(form.getFieldError('summary')).toEqual(['confirm it']));
    form.setFieldValue('summary', 'x');
    form.userChange(items['user,name'].item, 'n');
    await vi.waitFor(() => expect(form.getFieldError('summary')).toEqual([]));
  });
});

describe('FORM-8: the hooks', () => {
  it('onvalueschange gets what the user changed and all the registered values, and is not called for code', () => {
    const { form, items } = mounted({ a: {}, 'u,v': {} }, { a: 1, u: { v: 1 } });
    const onvalueschange = vi.fn();
    form.bind({ onvalueschange });
    form.userChange(items['u,v'].item, 5);
    expect(onvalueschange).toHaveBeenCalledWith({ u: { v: 5 } }, { a: 1, u: { v: 5 } });
    form.setFieldValue('a', 2);
    form.setFieldsValue({ a: 3 });
    expect(onvalueschange).toHaveBeenCalledTimes(1);
  });

  it('onfieldschange reports the change, then validating true, then validating false with the messages', async () => {
    const { form, items } = mounted({ a: { rules: [required] } }, { a: 'x' });
    const calls: { validating: boolean | undefined; errors: string[] | undefined; value: unknown }[] = [];
    form.bind({
      onfieldschange: (changed) => {
        const [field] = changed;
        calls.push({ validating: field.validating, errors: field.errors, value: field.value });
      }
    });
    form.userChange(items.a.item, '');
    await vi.waitFor(() => expect(calls).toHaveLength(3));
    expect(calls.map((c) => c.validating)).toEqual([false, true, false]);
    expect(calls[2].errors).toEqual(['needed']);
    expect(calls[0].value).toBe('');
  });

  it('submit does nothing without a form, and runs the form submit with one', () => {
    const form = createForm();
    expect(() => form.submit()).not.toThrow();
    const submit = vi.fn();
    form.bind({ submit });
    form.submit();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('the messages of the form reach the validation', async () => {
    const { form } = mounted({ a: { rules: [{ required: true }] } }, { a: '' });
    form.bind({ messages: () => ({ required: 'Please fill ${name}' }) });
    expect((await failure(form)).errorFields[0].errors).toEqual(['Please fill a']);
  });
});

describe('STORE-10: preserve', () => {
  it('an item that leaves removes its value when preserve is false, and keeps it otherwise', () => {
    const form = createForm();
    form.init({ a: 1, b: 2 });
    const keep = entry('a');
    const drop = entry('b', { preserve: false });
    const unregisterKeep = form.register(keep.item);
    const unregisterDrop = form.register(drop.item);
    unregisterKeep();
    unregisterDrop();
    expect(form.getFieldsValue(true)).toEqual({ a: 1 });
  });

  it('a value stays while another item still has the same name', () => {
    const form = createForm();
    form.init({ a: 1 });
    const first = entry('a', { preserve: false });
    const second = entry('a', { preserve: false });
    const unregisterFirst = form.register(first.item);
    form.register(second.item);
    unregisterFirst();
    expect(form.getFieldValue('a')).toBe(1);
  });

  it('a leaving item drops its messages and its pending validation', async () => {
    vi.useFakeTimers();
    const validator = vi.fn();
    const form = createForm();
    form.init({ a: '' });
    const a = entry('a', { rules: [{ validator }], debounce: 50 });
    const unregister = form.register(a.item);
    form.userChange(a.item, 'x');
    unregister();
    await vi.advanceTimersByTimeAsync(100);
    expect(validator).not.toHaveBeenCalled();
    expect(form.isFieldTouched('a')).toBe(false);
  });
});

describe('STORE-6: setFields and the reading of a list of fields', () => {
  it('setFields takes any part of the state of a field, and a field with nothing to set changes nothing', () => {
    const { form } = mounted({ a: {} }, { a: '' });
    form.setFields([{ name: ['a'], validating: true }]);
    expect(form.isFieldValidating('a')).toBe(true);
    form.setFields([{ name: ['a'], validating: false, warnings: ['w only'] }]);
    expect(form.getFieldWarning('a')).toEqual(['w only']);
    expect(form.getFieldError('a')).toEqual([]);
    form.setFields([{ name: ['a'], errors: ['e only'] }]);
    expect(form.getFieldError('a')).toEqual(['e only']);
    expect(form.getFieldWarning('a')).toEqual(['w only']);
    form.setFields([{ name: ['a'] }]);
    expect(form.getFieldError('a')).toEqual(['e only']);
  });

  it('two items with the same name are one field in the lists', () => {
    const form = createForm();
    form.init({ a: 1 });
    form.register(entry('a').item);
    form.register(entry('a').item);
    expect(form.getFieldsError()).toEqual([{ name: ['a'], errors: [], warnings: [] }]);
    expect(form.getFieldsValue()).toEqual({ a: 1 });
  });

  it('a rule can list several triggers of its own', async () => {
    const { form, items } = mounted(
      { a: { rules: [{ required: true, message: 'both', validateTrigger: ['change', 'blur'] }], triggers: ['change', 'blur'] } },
      { a: 'x' }
    );
    form.userChange(items.a.item, '');
    await vi.waitFor(() => expect(form.getFieldError('a')).toEqual(['both']));
  });

  it('the failing fields of a validation come in the order of the page, not of the registration', async () => {
    const page = document.createElement('div');
    page.innerHTML = '<div id="first"></div><div id="second"></div>';
    document.body.append(page);
    const form = createForm();
    form.init({ later: '', earlier: '' });
    const later = entry('later', { rules: [required], container: page.querySelector('#second') });
    const earlier = entry('earlier', { rules: [required], container: page.querySelector('#first') });
    form.register(later.item);
    form.register(earlier.item);
    expect((await failure(form)).errorFields.map((field) => field.name[0])).toEqual(['earlier', 'later']);
    page.remove();
  });

  it('fields that share one container keep the order they have', async () => {
    const box = document.createElement('div');
    document.body.append(box);
    const form = createForm();
    form.init({ one: '', two: '' });
    form.register(entry('one', { rules: [required], container: box }).item);
    form.register(entry('two', { rules: [required], container: box }).item);
    expect((await failure(form)).errorFields.map((field) => field.name[0])).toEqual(['one', 'two']);
    box.remove();
  });

  it('a field whose item has a value of undefined as its initial one is removed by resetFields', () => {
    const { form, items } = mounted({ a: {} }, {});
    form.setItemInitial(['a'], undefined);
    form.userChange(items.a.item, 'typed');
    form.resetFields();
    expect(form.getFieldValue('a')).toBeUndefined();
  });
});

describe('STORE-9: scrollToField', () => {
  it('does nothing for a field whose control cannot be found', () => {
    const { form } = mounted({ a: { controlId: 'nowhere', container: null } });
    expect(() => form.scrollToField('a', { focus: true })).not.toThrow();
  });

  it('a control with nothing focusable inside is scrolled to itself and not focused', () => {
    const box = document.createElement('div');
    box.innerHTML = '<div id="plain">text only</div>';
    document.body.append(box);
    const plain = box.querySelector('#plain') as HTMLElement;
    plain.scrollIntoView = vi.fn();
    const { form } = mounted({ a: { controlId: 'plain', container: box } });
    form.scrollToField('a', { focus: true });
    expect(plain.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).not.toBe(plain);
    box.remove();
  });

  const place = () => {
    const box = document.createElement('div');
    box.innerHTML = '<input id="control" /><button id="other">x</button>';
    document.body.append(box);
    return box;
  };

  it('scrolls the control into view and focuses it with focus: true', () => {
    const box = place();
    const input = box.querySelector('#control') as HTMLInputElement;
    const scroll = vi.fn();
    input.scrollIntoView = scroll;
    const { form } = mounted({ a: { controlId: 'control', container: box } });
    form.scrollToField('a', { focus: true, behavior: 'smooth' });
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    expect(document.activeElement).toBe(input);
    box.remove();
  });

  it('only scrolls without focus, falls back to the first focusable control in the box, and ignores unknown fields', () => {
    const box = place();
    const button = box.querySelector('#other') as HTMLElement;
    const input = box.querySelector('#control') as HTMLInputElement;
    input.scrollIntoView = vi.fn();
    const { form } = mounted({ a: { controlId: 'missing', container: box } });
    form.scrollToField('a');
    expect(document.activeElement).not.toBe(input);
    form.scrollToField('a', { focus: true });
    expect(document.activeElement).toBe(input);
    expect(() => form.scrollToField('unknown', { focus: true })).not.toThrow();
    void button;
    box.remove();
  });

  it('a control that is not focusable itself hands focus to the first focusable inside it', () => {
    const box = document.createElement('div');
    box.innerHTML = '<div id="group"><input id="inner" /></div>';
    document.body.append(box);
    const { form } = mounted({ a: { controlId: 'group', container: box } });
    form.scrollToField('a', { focus: true });
    expect(document.activeElement).toBe(box.querySelector('#inner'));
    box.remove();
  });
});
