import { describe, expect, it, vi } from 'vitest';
import { defaultValidateMessages, formatMessage, mergeMessages } from '../src/lib/Form/messages.js';
import type { FormRuleConfig } from '../src/lib/Form/types.js';
import { runRules, type RuleRunInput } from '../src/lib/Form/validate.js';

const run = (value: unknown, rules: FormRuleConfig[], extra: Partial<RuleRunInput> = {}) =>
  runRules({
    value,
    rules,
    messages: mergeMessages(),
    variables: { name: 'Field' },
    ...extra
  });

const errors = async (value: unknown, rules: FormRuleConfig[], extra: Partial<RuleRunInput> = {}) =>
  (await run(value, rules, extra)).errors;

describe('VAL-6: message templates', () => {
  it('formatMessage fills ${name} style variables', () => {
    expect(formatMessage("'${name}' needs ${min}", { name: 'Age', min: '3' })).toBe("'Age' needs 3");
  });

  it('formatMessage keeps \\${name} as text and leaves an unknown variable as it is', () => {
    expect(formatMessage('${a} \\${a} ${b}', { a: 'x' })).toBe('x ${a} ${b}');
  });

  it('mergeMessages ignores a key that is undefined', () => {
    expect(mergeMessages({ required: undefined, string: { min: undefined } }).required).toBe(defaultValidateMessages.required);
    expect(mergeMessages({ string: { min: undefined } }).string?.min).toBe(defaultValidateMessages.string.min);
  });

  it('mergeMessages lays the given messages over the defaults key by key and changes neither', () => {
    const own = { required: 'Need ${name}', string: { min: 'Too short' } };
    const merged = mergeMessages(own);
    expect(merged.required).toBe('Need ${name}');
    expect(merged.string?.min).toBe('Too short');
    expect(merged.string?.max).toBe(defaultValidateMessages.string.max);
    expect(defaultValidateMessages.required).toBe("'${name}' is required");
    expect(own.string).toEqual({ min: 'Too short' });
  });

  it('the generated message names the field and the limit', async () => {
    expect(await errors('a', [{ min: 3 }])).toEqual(["'Field' must be at least 3 characters"]);
    expect(await errors('abcd', [{ max: 3 }])).toEqual(["'Field' cannot be longer than 3 characters"]);
    expect(await errors('', [{ required: true }])).toEqual(["'Field' is required"]);
  });

  it('a rule message is a template too, and \\${ is not substituted', async () => {
    expect(await errors('', [{ required: true, message: '${name} is a must, \\${name} stays' }])).toEqual([
      'Field is a must, ${name} stays'
    ]);
  });

  it('messageVariables reach the templates', async () => {
    expect(await errors('', [{ required: true, message: '${what} please' }], { variables: { name: 'F', what: 'Fill it' } })).toEqual([
      'Fill it please'
    ]);
  });

  it('the validateMessages of the form replace the generated text', async () => {
    const messages = mergeMessages({ required: 'Fill ${name}!' });
    expect(await errors('', [{ required: true }], { messages })).toEqual(['Fill Field!']);
  });
});

describe('VAL-3: the rule keys', () => {
  it('required: undefined, null, an empty string and an empty array fail; 0, false and whitespace pass', async () => {
    for (const empty of [undefined, null, '', []]) expect(await errors(empty, [{ required: true }])).toHaveLength(1);
    for (const filled of [0, false, '  ', 'x', [1]]) expect(await errors(filled, [{ required: true }])).toEqual([]);
  });

  it('whitespace: a string of only whitespace fails', async () => {
    expect(await errors('   ', [{ required: true, whitespace: true }])).toHaveLength(1);
    expect(await errors(' a ', [{ required: true, whitespace: true }])).toEqual([]);
  });

  it('a field that is not required passes while empty, whatever the other keys say', async () => {
    expect(await errors('', [{ min: 3 }])).toEqual([]);
    expect(await errors('', [{ type: 'email' }])).toEqual([]);
  });

  it('type: the built-in types', async () => {
    const bad = (type: FormRuleConfig['type'], value: unknown) => errors(value, [{ type, required: true }]);
    expect(await bad('number', 'x')).toHaveLength(1);
    expect(await bad('number', 3)).toEqual([]);
    expect(await bad('number', Number.NaN)).toHaveLength(1);
    expect(await bad('integer', 1.5)).toHaveLength(1);
    expect(await bad('integer', 2)).toEqual([]);
    expect(await bad('float', 1.5)).toEqual([]);
    expect(await bad('boolean', 'true')).toHaveLength(1);
    expect(await bad('boolean', false)).toEqual([]);
    expect(await bad('array', 'a')).toHaveLength(1);
    expect(await bad('array', ['a'])).toEqual([]);
    expect(await bad('object', [])).toHaveLength(1);
    expect(await bad('object', {})).toEqual([]);
    expect(await bad('email', 'nope')).toEqual(["'Field' is not a valid email"]);
    expect(await bad('email', 'a@b.co')).toEqual([]);
    expect(await bad('url', 'nope')).toEqual(["'Field' is not a valid url"]);
    expect(await bad('url', 'https://example.com')).toEqual([]);
    expect(await bad('tel', 'abc')).toEqual(["'Field' is not a valid phone number"]);
    expect(await bad('date', new Date())).toEqual([]);
    expect(await bad('hex', '#ff00ff')).toEqual([]);
    expect(await bad('any', { whatever: 1 })).toEqual([]);
  });

  it('len, min and max: the length of a string or array, the value of a number; len wins over a range', async () => {
    expect(await errors('ab', [{ len: 3 }])).toEqual(["'Field' must be exactly 3 characters"]);
    expect(await errors('abc', [{ len: 3 }])).toEqual([]);
    expect(await errors(3, [{ type: 'number', min: 5 }])).toEqual(["'Field' cannot be less than 5"]);
    expect(await errors(9, [{ type: 'number', max: 5 }])).toEqual(["'Field' cannot be greater than 5"]);
    expect(await errors([1], [{ type: 'array', len: 2 }])).toEqual(["'Field' must be exactly 2 in length"]);
    expect(await errors([1, 2, 3], [{ type: 'array', max: 2 }])).toEqual(["'Field' cannot be greater than 2 in length"]);
    expect(await errors('a', [{ min: 2, max: 4 }])).toEqual(["'Field' must be between 2 and 4 characters"]);
    expect(await errors('abcdef', [{ len: 3, min: 1, max: 10 }])).toEqual(["'Field' must be exactly 3 characters"]);
    expect(await errors(0, [{ type: 'number', min: 1 }])).toHaveLength(1);
  });

  it('pattern and enum', async () => {
    expect(await errors('b', [{ pattern: /^a+$/ }])).toEqual(["'Field' does not match pattern /^a+$/"]);
    expect(await errors('aa', [{ pattern: /^a+$/ }])).toEqual([]);
    expect(await errors('c', [{ type: 'enum', enum: ['a', 'b'] }])).toEqual(["'Field' must be one of a, b"]);
    expect(await errors('a', [{ type: 'enum', enum: ['a', 'b'] }])).toEqual([]);
    expect(await errors(0, [{ type: 'enum', enum: [0, 1] }])).toEqual([]);
  });

  it('transform changes the value before the check', async () => {
    const rule: FormRuleConfig = { required: true, whitespace: true, transform: (v: string) => v.trim() };
    expect(await errors('   ', [rule])).toHaveLength(1);
    expect(await errors('  x ', [{ pattern: /^x$/, transform: (v: string) => v.trim() }])).toEqual([]);
  });

  it('fields and defaultField: rules for the keys of an object and the elements of an array', async () => {
    const object: FormRuleConfig = {
      type: 'object',
      required: true,
      fields: { a: { required: true, message: 'a is needed' }, b: { type: 'number' } }
    };
    expect(await errors({}, [object])).toEqual(['a is needed']);
    expect(await errors({ a: 'x', b: 'no' }, [object])).toHaveLength(1);
    expect(await errors({ a: 'x', b: 2 }, [object])).toEqual([]);
    const list: FormRuleConfig = { type: 'array', defaultField: { type: 'email', message: 'bad ${name}' } };
    expect(await errors(['a@b.co', 'bad'], [list])).toEqual(['bad Field']);
  });

  it('every failing rule shows its message, in the order of the rules', async () => {
    expect(await errors('a', [{ min: 3 }, { pattern: /^\d+$/, message: 'digits only' }])).toEqual([
      "'Field' must be at least 3 characters",
      'digits only'
    ]);
  });

  it('a rule object is not changed by a run', async () => {
    const rule: FormRuleConfig = { required: true, message: 'x' };
    await run('', [rule]);
    expect(rule).toEqual({ required: true, message: 'x' });
  });
});

describe('VAL-3: a custom validator', () => {
  it('passes on nothing and on a resolved promise', async () => {
    expect(await errors('x', [{ validator: () => {} }])).toEqual([]);
    expect(await errors('x', [{ validator: async () => {} }])).toEqual([]);
  });

  it('fails by throwing, rejecting with a string or an error, or returning false, an error or errors', async () => {
    expect(await errors('x', [{ validator: () => { throw new Error('thrown'); } }])).toEqual(['thrown']);
    expect(await errors('x', [{ validator: () => Promise.reject('rejected text') }])).toEqual(['rejected text']);
    expect(await errors('x', [{ validator: () => Promise.reject(new Error('rejected error')) }])).toEqual(['rejected error']);
    expect(await errors('x', [{ validator: () => false }])).toEqual(["Validation error on 'Field'"]);
    expect(await errors('x', [{ validator: () => new Error('returned') }])).toEqual(['returned']);
    expect(await errors('x', [{ validator: () => [new Error('one'), new Error('two')] }])).toEqual(['one', 'two']);
  });

  it('the rule message is used when the failure has none', async () => {
    expect(await errors('x', [{ validator: () => false, message: 'custom ${name}' }])).toEqual(['custom Field']);
    expect(await errors('x', [{ validator: () => Promise.reject(new Error('')), message: 'fallback' }])).toEqual(['fallback']);
    expect(await errors('x', [{ validator: () => Promise.reject('own'), message: 'fallback' }])).toEqual(['own']);
  });

  it('gets the rule with the field name and the value (after transform)', async () => {
    const validator = vi.fn();
    await run(' x ', [{ validator, transform: (v: string) => v.trim(), min: 1 }]);
    expect(validator).toHaveBeenCalledTimes(1);
    const [rule, value] = validator.mock.calls[0];
    expect(value).toBe('x');
    expect(rule.field).toBe('value');
    expect(rule.min).toBe(1);
  });

  it('a rule with checks and a validator runs both (the library alone would run only the validator)', async () => {
    const validator = vi.fn();
    expect(await errors('', [{ required: true, validator }])).toEqual(["'Field' is required"]);
    expect(validator).toHaveBeenCalledTimes(1);
    expect(await errors('x', [{ required: true, validator: () => Promise.reject('no') }])).toEqual(['no']);
  });

  it('a failure that is not a string or an error is made into text, and an empty one into the message of the rule', async () => {
    expect(await errors('x', [{ validator: () => Promise.reject(42) }])).toEqual(['42']);
    expect(await errors('x', [{ validator: () => Promise.reject(null), message: 'was null' }])).toEqual(['was null']);
    expect(await errors('x', [{ validator: () => Promise.reject(undefined), message: 'was undefined' }])).toEqual(['was undefined']);
    expect(await errors('x', [{ validator: () => Promise.reject({}), message: 'ignored' }])).toEqual(['[object Object]']);
  });

  it('without a message of the rule or of the form, an empty failure says that validation failed', async () => {
    expect(await errors('x', [{ validator: () => false }], { messages: {} })).toEqual(['Validation failed']);
  });

  it('a validator below a field or an element runs by itself', async () => {
    expect(await errors({}, [{ type: 'object', fields: { a: { validator: () => Promise.reject('nested bad') } } }])).toEqual(['nested bad']);
    expect(await errors(['x'], [{ type: 'array', defaultField: { validator: () => Promise.reject('element bad') } }])).toEqual(['element bad']);
  });

  it('a bug that is not a failed rule is not hidden as a message', async () => {
    await expect(run('x', [{ transform: () => { throw new Error('transform bug'); }, min: 1 }])).rejects.toThrow('transform bug');
  });

  it('an error in a validator is the message of the field, never an unhandled rejection', async () => {
    await expect(run('x', [{ validator: () => { throw new TypeError('bug'); } }])).resolves.toEqual({
      errors: ['bug'],
      warnings: []
    });
  });
});

describe('VAL-3 and VAL-4: warnings and the order of the rules', () => {
  it('warningOnly puts the failure among the warnings, not the errors', async () => {
    expect(await run('a', [{ min: 3, warningOnly: true }, { pattern: /^\d+$/ }])).toEqual({
      errors: ["'Field' does not match pattern /^\\d+$/"],
      warnings: ["'Field' must be at least 3 characters"]
    });
  });

  it('validateFirst: true stops at the first failing rule, and a warning does not stop it', async () => {
    const second = vi.fn(() => false);
    const result = await run('', [{ required: true, warningOnly: true }, { required: true }, { validator: second }], {
      first: true
    });
    expect(result.warnings).toHaveLength(1);
    expect(result.errors).toEqual(["'Field' is required"]);
    expect(second).not.toHaveBeenCalled();
  });

  it("validateFirst: 'parallel' runs every rule and keeps the messages of the first failing one", async () => {
    const later = vi.fn(() => false);
    const result = await run('a', [{ min: 3 }, { validator: later }, { pattern: /^\d+$/ }], { first: 'parallel' });
    expect(later).toHaveBeenCalled();
    expect(result.errors).toEqual(["'Field' must be at least 3 characters"]);
  });

  it('without validateFirst every failing rule reports', async () => {
    expect((await run('a', [{ min: 3 }, { pattern: /^\d+$/ }])).errors).toHaveLength(2);
  });

  it('no rules, no messages', async () => {
    expect(await run('x', [])).toEqual({ errors: [], warnings: [] });
  });

  it('the library prints no warning to the console', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await run(123, [{ type: 'email' }]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
