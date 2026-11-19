// The store with a `model` (specs/form.md, revision R): the values live in the consumer's own `$state` object.
// A store is driven here by plain entries and the watchers that the items run, so no component is needed.
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pathText, toPath } from '../src/lib/Form/path.js';
import { createForm, type FieldEntry, type FormStore } from '../src/lib/Form/store.svelte.js';
import type { FormNamePath, FormRuleConfig, FormValidateTrigger } from '../src/lib/Form/types.js';
import { reactive } from './helpers/model.svelte.js';
import { track } from './helpers/track.svelte.js';

interface Profile {
  username: string;
  user: { city: string };
  tags: string[];
  confirm: string;
  extra?: number;
}

const profile = (): Profile => ({ username: 'a', user: { city: 'x' }, tags: ['t'], confirm: '' });

interface EntryOptions {
  rules?: FormRuleConfig[];
  triggers?: FormValidateTrigger[];
  deps?: FormNamePath[];
  preserve?: boolean;
}

/** What an item would tell the store, as a plain object. */
function entry(name: FormNamePath, options: EntryOptions = {}) {
  const path = toPath(name);
  const state = { composing: false };
  const item: FieldEntry = {
    id: Symbol(pathText(path)),
    path: () => path,
    rules: () => options.rules ?? [],
    triggers: () => options.triggers ?? ['change'],
    validateFirst: () => false,
    debounce: () => undefined,
    dependencies: () => (options.deps ?? []).map(toPath),
    variables: () => ({ name: pathText(path) }),
    preserve: () => options.preserve ?? true,
    composing: () => state.composing,
    controlId: () => `id-${pathText(path)}`,
    container: () => null
  };
  return { item, state };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

const watchers: Array<() => void> = [];
afterEach(() => {
  while (watchers.length) watchers.pop()!();
  vi.restoreAllMocks();
});

/** What the `Form` and its items do together: the model is attached, the items register and each runs its watcher. */
function wired(model: Profile, names: Record<string, EntryOptions> = {}, initial?: Record<string, unknown>, form: FormStore<Profile> = createForm<Profile>()) {
  const onvalueschange = vi.fn();
  form.bind({ onvalueschange });
  form.init(initial, model as unknown as Record<string, unknown>);
  const items = Object.fromEntries(
    Object.entries(names).map(([name, options]) => [name, entry(name.includes(',') ? name.split(',') : name, options)])
  );
  for (const { item } of Object.values(items)) {
    form.register(item);
    watchers.push(track(() => form.observe(item)).stop);
  }
  return { form, items, onvalueschange };
}

describe('MODEL-1: the values live in the model', () => {
  it('reads the model and writes to it, and the model keeps its identity', () => {
    const model = reactive(profile());
    const original = model;
    const { form } = wired(model);
    form.setFieldValue('username', 'z');
    expect(model.username).toBe('z');
    expect(form.getFieldValue('username')).toBe('z');
    model.username = 'q';
    expect(form.getFieldValue('username')).toBe('q');
    expect(model).toBe(original);
  });

  it('a read of the instance is tracked: it runs again when the model changes', () => {
    const model = reactive(profile());
    const { form } = wired(model);
    const reads = track(() => form.getFieldValue('username'));
    watchers.push(reads.stop);
    model.username = 'next';
    flushSync();
    expect(reads.values).toEqual(['a', 'next']);
  });

  it('getFieldsValue(true) and the values of the registered fields come from the model', () => {
    const model = reactive(profile());
    const { form } = wired(model, { username: {} });
    expect(form.getFieldsValue()).toEqual({ username: 'a' });
    expect(form.getFieldsValue(true)).toEqual(profile());
  });
});

describe('MODEL-2: a direct change of a registered field is a user change (Q5 A)', () => {
  it('marks the field touched, tells onvalueschange, and validates on change', async () => {
    const model = reactive(profile());
    const { form, onvalueschange } = wired(model, { username: { rules: [{ min: 3, message: 'short' }] } });
    model.username = 'ab';
    flushSync();
    expect(form.isFieldTouched('username')).toBe(true);
    expect(onvalueschange).toHaveBeenCalledTimes(1);
    expect(onvalueschange).toHaveBeenCalledWith({ username: 'ab' }, { username: 'ab' });
    await settle();
    expect(form.getFieldError('username')).toEqual(['short']);
    model.username = 'abc';
    flushSync();
    await settle();
    expect(form.getFieldError('username')).toEqual([]);
  });

  it('watches a nested field and every part of an array', () => {
    const model = reactive(profile());
    const { form, onvalueschange } = wired(model, { 'user,city': {}, tags: {} });
    model.user.city = 'y';
    flushSync();
    expect(form.isFieldTouched(['user', 'city'])).toBe(true);
    expect(onvalueschange).toHaveBeenLastCalledWith({ user: { city: 'y' } }, { user: { city: 'y' }, tags: ['t'] });
    model.tags.push('u');
    flushSync();
    expect(onvalueschange).toHaveBeenLastCalledWith({ tags: ['t', 'u'] }, { user: { city: 'y' }, tags: ['t', 'u'] });
    expect(onvalueschange).toHaveBeenCalledTimes(2);
  });

  it('does not report a write that leaves the value as it was', () => {
    const model = reactive(profile());
    const { onvalueschange } = wired(model, { username: {} });
    model.username = 'a';
    flushSync();
    expect(onvalueschange).not.toHaveBeenCalled();
  });

  it('validates the fields that depend on it again', async () => {
    const model = reactive(profile());
    const { form } = wired(model, {
      username: {},
      confirm: { rules: [{ required: true, message: 'confirm it' }], deps: ['username'] }
    });
    form.setFields([{ name: ['confirm'], touched: true }]);
    model.username = 'b';
    flushSync();
    await settle();
    expect(form.getFieldError('confirm')).toEqual(['confirm it']);
  });

  it('holds a change validation until the IME composition ends (MODEL-13)', async () => {
    const model = reactive(profile());
    const { form, items } = wired(model, { username: { rules: [{ min: 3, message: 'short' }] } });
    items.username.state.composing = true;
    model.username = 'ab';
    flushSync();
    await settle();
    expect(form.getFieldError('username')).toEqual([]);
    items.username.state.composing = false;
    form.compositionEnd(items.username.item);
    await settle();
    expect(form.getFieldError('username')).toEqual(['short']);
  });
});

describe('MODEL-3: the setter of a field reports once', () => {
  it('userChange writes the model and the watcher does not report it again', () => {
    const model = reactive(profile());
    const { form, items, onvalueschange } = wired(model, { username: {} });
    form.userChange(items.username.item, 'zz');
    flushSync();
    expect(model.username).toBe('zz');
    expect(onvalueschange).toHaveBeenCalledTimes(1);
  });

  it('two items on one name report one change', () => {
    const model = reactive(profile());
    const form = createForm<Profile>();
    const onvalueschange = vi.fn();
    form.bind({ onvalueschange });
    form.init(undefined, model as unknown as Record<string, unknown>);
    for (let index = 0; index < 2; index++) {
      const { item } = entry('username');
      form.register(item);
      watchers.push(track(() => form.observe(item)).stop);
    }
    model.username = 'both';
    flushSync();
    expect(onvalueschange).toHaveBeenCalledTimes(1);
  });
});

describe('MODEL-4: what the store writes itself is not a user change', () => {
  it('setFieldValue, setFieldsValue and setFields write the model and report nothing', () => {
    const model = reactive(profile());
    const { form, onvalueschange } = wired(model, { username: {}, 'user,city': {}, user: {}, tags: {} });
    form.setFieldValue('username', 'one');
    form.setFieldsValue({ user: { city: 'two' }, tags: ['v'] });
    form.setFields([{ name: ['username'], value: 'three' }]);
    form.setFieldValue('user', { city: 'four' });
    flushSync();
    expect(model).toMatchObject({ username: 'three', user: { city: 'four' }, tags: ['v'] });
    expect(onvalueschange).not.toHaveBeenCalled();
    expect(form.isFieldsTouched()).toBe(false);
  });

  it('resetFields writes the model back and reports nothing', () => {
    const model = reactive(profile());
    const { form, onvalueschange } = wired(model, { username: {}, 'user,city': {} });
    model.username = 'changed';
    flushSync();
    onvalueschange.mockClear();
    form.resetFields();
    flushSync();
    expect(model.username).toBe('a');
    expect(onvalueschange).not.toHaveBeenCalled();
    expect(form.isFieldTouched('username')).toBe(false);
    form.setFieldValue('user', { city: 'z' });
    form.resetFields([['user', 'city'], 'username']);
    flushSync();
    expect(model.user.city).toBe('x');
    expect(onvalueschange).not.toHaveBeenCalled();
  });

  it('a value an item gives (initialValue) is not a user change', () => {
    const model = reactive({ ...profile(), extra: undefined });
    const { form, onvalueschange } = wired(model, { extra: {} });
    form.setItemInitial(['extra'], 7);
    flushSync();
    expect(model.extra).toBe(7);
    expect(onvalueschange).not.toHaveBeenCalled();
  });
});

describe('MODEL-5: initial values fill only what the model lacks', () => {
  it('the model wins over initialValues and over what was set on the instance before', () => {
    const model = reactive({ username: 'mine' } as Profile);
    const form = createForm<Profile>();
    form.setFieldsValue({ username: 'preset', user: { city: 'preset city' } });
    form.init({ username: 'init', user: { city: 'init city' }, confirm: 'init confirm' }, model as unknown as Record<string, unknown>);
    expect(model.username).toBe('mine');
    expect(model.user.city).toBe('preset city');
    expect(model.confirm).toBe('init confirm');
  });

  it('fills a nested object key by key', () => {
    const model = reactive({ username: 'u', user: {} } as Profile);
    const form = createForm<Profile>();
    form.init({ user: { city: 'c' } }, model as unknown as Record<string, unknown>);
    expect(model.user.city).toBe('c');
  });
});

describe('MODEL-6: reset returns to the snapshot taken when the form mounted', () => {
  it('writes the snapshot into the same object and removes keys that were added later', () => {
    const model = reactive(profile());
    const { form } = wired(model, { username: {} });
    model.username = 'changed';
    model.user = { city: 'elsewhere' };
    model.extra = 5;
    form.resetFields();
    expect(model).toEqual(profile());
    expect('extra' in model).toBe(false);
  });

  it('an item initialValue is part of what reset returns to', () => {
    const model = reactive(profile());
    const { form } = wired(model, { extra: {} });
    form.setItemInitial(['extra'], 9);
    model.extra = 1;
    form.resetFields();
    expect(model.extra).toBe(9);
    model.extra = 2;
    form.resetFields(['extra']);
    expect(model.extra).toBe(9);
  });

  it('resetFields(names) removes a value that had none at mount', () => {
    const model = reactive(profile());
    const { form } = wired(model, { extra: {} });
    model.extra = 3;
    flushSync();
    form.resetFields(['extra']);
    expect(model.extra).toBeUndefined();
  });
});

describe('MODEL-7: values given out are copies', () => {
  it('getFieldsValue returns snapshots, and a change of the copy does not reach the model', () => {
    const model = reactive(profile());
    const { form } = wired(model, { username: {}, tags: {} });
    const copy = form.getFieldsValue(true);
    expect(copy).not.toBe(model);
    copy.user.city = 'changed';
    copy.tags.push('copy');
    expect(model.user.city).toBe('x');
    expect(model.tags).toEqual(['t']);
    expect(form.getFieldsValue().tags).not.toBe(model.tags);
  });

  it('onvalueschange receives copies', () => {
    const model = reactive(profile());
    const { onvalueschange } = wired(model, { tags: {} });
    model.tags.push('u');
    flushSync();
    const [changed, all] = onvalueschange.mock.calls[0] as [Profile, Profile];
    expect(changed.tags).not.toBe(model.tags);
    expect(all.tags).not.toBe(model.tags);
  });
});

describe('MODEL-8: a replaced model is attached again', () => {
  it('reads the new object without reporting a change, and keeps the snapshot of the first one', () => {
    const first = reactive(profile());
    const { form, onvalueschange } = wired(first, { username: {} });
    const second = reactive({ ...profile(), username: 'second' });
    form.attachModel(second as unknown as Record<string, unknown>);
    flushSync();
    expect(form.getFieldValue('username')).toBe('second');
    expect(onvalueschange).not.toHaveBeenCalled();
    form.resetFields();
    expect(second.username).toBe('a');
    second.username = 'edited';
    flushSync();
    expect(onvalueschange).toHaveBeenCalledTimes(1);
  });

  it('attaching the model it already has changes nothing', () => {
    const model = reactive(profile());
    const { form, onvalueschange } = wired(model, { username: {} });
    form.attachModel(model as unknown as Record<string, unknown>);
    flushSync();
    expect(onvalueschange).not.toHaveBeenCalled();
    expect(form.getFieldValue('username')).toBe('a');
  });

  it('a removed model leaves its values in the store', () => {
    const model = reactive(profile());
    const { form } = wired(model, { username: {} });
    model.username = 'kept';
    form.attachModel(undefined);
    expect(form.getFieldValue('username')).toBe('kept');
    form.setFieldValue('username', 'own');
    expect(model.username).toBe('kept');
    expect(form.getFieldValue('username')).toBe('own');
  });

  it('removing a model when there was none does nothing', () => {
    const form = createForm<Profile>();
    form.init({ username: 'a' });
    form.attachModel(undefined);
    expect(form.getFieldValue('username')).toBe('a');
  });
});

describe('MODEL-9: preserve', () => {
  it('an item that leaves with preserve false deletes its key from the model, with preserve true it keeps it', () => {
    const model = reactive(profile());
    const form = createForm<Profile>();
    form.init(undefined, model as unknown as Record<string, unknown>);
    const dropped = entry('extra', { preserve: false });
    const kept = entry('confirm', { preserve: true });
    model.extra = 1;
    const leaveDropped = form.register(dropped.item);
    const leaveKept = form.register(kept.item);
    leaveDropped();
    leaveKept();
    expect('extra' in model).toBe(false);
    expect(model.confirm).toBe('');
  });
});

describe('MODEL-11: without a model nothing is watched', () => {
  it('observe does nothing, and the store works on its own values', () => {
    const form = createForm<Profile>();
    const onvalueschange = vi.fn();
    form.bind({ onvalueschange });
    form.init({ username: 'own' });
    const { item } = entry('username');
    form.register(item);
    watchers.push(track(() => form.observe(item)).stop);
    form.setFieldValue('username', 'next');
    flushSync();
    expect(form.getFieldValue('username')).toBe('next');
    expect(onvalueschange).not.toHaveBeenCalled();
  });
});
