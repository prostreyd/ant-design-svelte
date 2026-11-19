// What the store does when the validation itself breaks (a bug in the adapter or the library), which a rule cannot cause:
// the flag of the field must not stay "validating" for ever, and the error must reach the caller.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createForm, type FieldEntry } from '../src/lib/Form/store.svelte.js';

vi.mock('../src/lib/Form/validate.js', () => ({
  runRules: vi.fn(async () => {
    throw new Error('the library broke');
  })
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const entry = (): FieldEntry => ({
  id: Symbol('a'),
  path: () => ['a'],
  rules: () => [{ required: true }],
  triggers: () => ['change'],
  validateFirst: () => false,
  debounce: () => undefined,
  dependencies: () => [],
  variables: () => ({ name: 'a' }),
  preserve: () => true,
  composing: () => false,
  controlId: () => 'a',
  container: () => null
});

describe('a validation that breaks', () => {
  it('validateFields rejects with the error, and the field is not left validating', async () => {
    const form = createForm();
    form.init({ a: '' });
    form.register(entry());
    await expect(form.validateFields()).rejects.toThrow('the library broke');
    expect(form.isFieldValidating('a')).toBe(false);
  });

  it('a validation started by a change is reported to the console and does not leave the field validating', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const form = createForm();
    form.init({ a: '' });
    const a = entry();
    form.register(a);
    form.userChange(a, 'x');
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(form.isFieldValidating('a')).toBe(false);
  });

  it('a result that is not the latest does not touch the flag of a newer run', async () => {
    const form = createForm();
    form.init({ a: '' });
    const a = entry();
    form.register(a);
    const first = form.validateFields().catch(() => 'first');
    form.setFields([{ name: ['a'], validating: true }]);
    await first;
    expect(form.isFieldValidating('a')).toBe(true);
  });
});
