// The types of the instance and the props (specs/form.md, revision R). The checks are of the compiler: `npm run check` fails
// when one of them stops holding (the `@ts-expect-error` lines must stay errors); the runtime part only makes the file run.
import { render } from '@testing-library/svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createForm } from '../src/lib/Form/store.svelte.js';
import type { FormDeepPartial, FormInstance, FormProps } from '../src/lib/Form/types.js';
import FormTyped from './fixtures/FormTyped.svelte';

interface Signup {
  username: string;
  age: number;
  address: { city: string; zip: string };
  tags: string[];
}

describe('TYPE-1: createForm<Values>() types the instance', () => {
  it('reads by key; every value of the store and the result of validateFields are Values', () => {
    const form = createForm<Signup>();
    expectTypeOf(form.getFieldValue('username')).toEqualTypeOf<string>();
    expectTypeOf(form.getFieldValue('age')).toEqualTypeOf<number>();
    expectTypeOf(form.getFieldValue('tags')).toEqualTypeOf<string[]>();
    expectTypeOf(form.getFieldValue(['address', 'city'])).toEqualTypeOf<unknown>();
    expectTypeOf(form.getFieldsValue(true)).toEqualTypeOf<Signup>();
    expectTypeOf(form.validateFields()).toEqualTypeOf<Promise<Signup>>();
    expect(form.getFieldValue('username')).toBeUndefined();
  });

  it('writes by key with the type of the key, by path without a type, and a partial of the values', () => {
    const form = createForm<Signup>();
    form.setFieldValue('age', 3);
    form.setFieldValue(['address', 'zip'], 'any');
    form.setFieldsValue({ address: { city: 'Osh' } });
    expect(form.getFieldValue('age')).toBe(3);
    // Never called: the compiler is the test.
    const wrong = () => {
      // @ts-expect-error a string is not an age
      form.setFieldValue('age', 'three');
      // @ts-expect-error `nothing` is not a field of the values
      form.setFieldValue('nothing', 1);
      // @ts-expect-error `nothing` is not a field of the values
      form.getFieldValue('nothing');
      // @ts-expect-error `nothing` is not a field of the values
      form.setFieldsValue({ nothing: 1 });
    };
    expect(typeof wrong).toBe('function');
  });

  it('the props refuse the wrong shape', () => {
    const wrong = () => {
      // @ts-expect-error `initialValues` must have the shape of the values
      const initial: FormProps<Signup> = { initialValues: { nothing: true } };
      // @ts-expect-error the model must have the shape of the values
      const model: FormProps<Signup> = { model: { username: 1 } };
      // @ts-expect-error onfinish gets the values as Signup
      const finish: FormProps<Signup> = { onfinish: (values: { other: string }) => void values };
      return [initial, model, finish];
    };
    expect(typeof wrong).toBe('function');
  });

  it('the props carry Values: onfinish, onvalueschange, initialValues, model', () => {
    expectTypeOf<FormProps<Signup>['onfinish']>().toEqualTypeOf<((values: Signup) => void) | undefined>();
    expectTypeOf<FormProps<Signup>['model']>().toEqualTypeOf<Signup | undefined>();
    expectTypeOf<FormProps<Signup>['initialValues']>().toEqualTypeOf<FormDeepPartial<Signup> | undefined>();
    expectTypeOf<FormProps<Signup>['onvalueschange']>().toEqualTypeOf<
      ((changed: FormDeepPartial<Signup>, all: Signup) => void) | undefined
    >();
    expect(true).toBe(true);
  });

  it('FormDeepPartial makes keys optional through objects and leaves arrays, dates and functions as they are', () => {
    type Shape = { a: { b: string; c: { d: number } }; list: string[]; when: Date; run: () => void };
    expectTypeOf<FormDeepPartial<Shape>['a']>().toEqualTypeOf<{ b?: string; c?: { d?: number } } | undefined>();
    expectTypeOf<FormDeepPartial<Shape>['list']>().toEqualTypeOf<string[] | undefined>();
    expectTypeOf<FormDeepPartial<Shape>['when']>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<FormDeepPartial<Shape>['run']>().toEqualTypeOf<(() => void) | undefined>();
    expect(true).toBe(true);
  });
});

describe('TYPE-4: getFieldsValue promises only the fields it reads', () => {
  it('no argument, a list of names and a filter give a deep partial; `true` gives the whole Values', () => {
    const form = createForm<Signup>();
    expectTypeOf(form.getFieldsValue()).toEqualTypeOf<FormDeepPartial<Signup>>();
    expectTypeOf(form.getFieldsValue(['username'])).toEqualTypeOf<FormDeepPartial<Signup>>();
    expectTypeOf(form.getFieldsValue([['address', 'city']])).toEqualTypeOf<FormDeepPartial<Signup>>();
    expectTypeOf(form.getFieldsValue({ filter: () => true })).toEqualTypeOf<FormDeepPartial<Signup>>();
    expectTypeOf(form.getFieldsValue(['username'], { filter: () => true })).toEqualTypeOf<FormDeepPartial<Signup>>();
    expectTypeOf(form.getFieldsValue(true)).toEqualTypeOf<Signup>();
    expect(form.getFieldsValue()).toEqual({});
    expect(form.getFieldsValue(true)).toEqual({});
  });

  it('a field of the partial has to be checked before it is used, down through nested objects', () => {
    const form = createForm<Signup>();
    // Never called: the compiler is the test.
    const reads = () => {
      const values = form.getFieldsValue();
      // @ts-expect-error `age` may be missing, so it has no `toFixed` until it is checked
      values.age.toFixed();
      // @ts-expect-error `address` may be missing, so `city` cannot be read without a check
      void values.address.city.length;
      // @ts-expect-error `city` may be missing inside an `address` that is there
      void values.address?.city.length;
      const checked = values.address?.city?.length ?? values.age?.toFixed();
      // The whole of the store is read by `true`: its fields are there.
      const everything = form.getFieldsValue(true);
      return [checked, everything.age.toFixed(), everything.address.city.length];
    };
    expect(typeof reads).toBe('function');
  });

  it('the callbacks that promise Values keep it (validateFields, onfinish, onfinishfailed, onvalueschange)', () => {
    const form = createForm<Signup>();
    expectTypeOf(form.validateFields()).toEqualTypeOf<Promise<Signup>>();
    expectTypeOf<FormProps<Signup>['onfinish']>().toEqualTypeOf<((values: Signup) => void) | undefined>();
    expect(form.getFieldsValue()).toEqual({});
  });

  it('createForm() without a type keeps an open record (TYPE-2)', () => {
    const form = createForm();
    expectTypeOf(form.getFieldsValue()).toEqualTypeOf<FormDeepPartial<Record<string, unknown>>>();
    expectTypeOf(form.getFieldsValue(true)).toEqualTypeOf<Record<string, unknown>>();
    expect(form.getFieldsValue(true)).toEqual({});
  });
});

describe('TYPE-2: without a type the instance is as it was', () => {
  it('createForm() keeps Record<string, unknown>', () => {
    const form = createForm();
    expectTypeOf(form.getFieldValue('anything')).toEqualTypeOf<unknown>();
    expectTypeOf(form.getFieldsValue()).toEqualTypeOf<Record<string, unknown>>();
    expectTypeOf<FormInstance>().toEqualTypeOf<FormInstance<Record<string, unknown>>>();
    expectTypeOf<FormProps['onfinish']>().toEqualTypeOf<((values: Record<string, unknown>) => void) | undefined>();
    form.setFieldValue('anything', 1);
    expect(form.getFieldValue('anything')).toBe(1);
  });

  it('a typed instance can be handed to code that wants any form', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the point of the check
    const loose: FormInstance<any> = createForm<Signup>();
    expect(loose).toBeDefined();
  });
});

describe('TYPE-3: a Form infers Values from the instance or from the model', () => {
  it('compiles as written in tests/fixtures/FormTyped.svelte (the errors there are expected)', () => {
    const { container } = render(FormTyped);
    expect(container.querySelectorAll('form')).toHaveLength(3);
  });
});
