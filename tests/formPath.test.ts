import { describe, expect, it } from 'vitest';
import {
  clone,
  deleteIn,
  fillMissing,
  getIn,
  isEqual,
  isPrefix,
  leafPaths,
  lookupRules,
  mergeDeep,
  pathId,
  pathKey,
  pathText,
  setIn,
  toPath
} from '../src/lib/Form/path.js';

describe('STORE-2: name paths', () => {
  it('a name is a key or a list of steps', () => {
    expect(toPath('a')).toEqual(['a']);
    expect(toPath(3)).toEqual([3]);
    expect(toPath(['user', 'address', 0])).toEqual(['user', 'address', 0]);
  });

  it('toPath copies a list, so a later change of the input does not change the path', () => {
    const source = ['a', 'b'];
    const path = toPath(source);
    source.push('c');
    expect(path).toEqual(['a', 'b']);
  });

  it('a number and its string are the same key, an id and a text', () => {
    expect(pathKey(['users', 0])).toBe(pathKey(['users', '0']));
    expect(pathKey(['a', 'b'])).not.toBe(pathKey(['ab']));
    expect(pathId(['user', 'name'])).toBe('user_name');
    expect(pathText(['users', 0, 'name'])).toBe('users.0.name');
  });

  it('getIn reads nested values and answers undefined where the path leaves the data', () => {
    const data = { user: { tags: ['a', 'b'] }, empty: null };
    expect(getIn(data, ['user', 'tags', 1])).toBe('b');
    expect(getIn(data, ['user', 'missing', 'deeper'])).toBeUndefined();
    expect(getIn(data, ['empty', 'x'])).toBeUndefined();
    expect(getIn(undefined, ['x'])).toBeUndefined();
    expect(getIn(data, [])).toBe(data);
  });

  it('setIn creates objects for string steps and an array for a number step', () => {
    const target: Record<string, unknown> = {};
    setIn(target, ['user', 'name'], 'Ann');
    setIn(target, ['users', 0, 'name'], 'Bo');
    expect(target).toEqual({ user: { name: 'Ann' }, users: [{ name: 'Bo' }] });
    expect(Array.isArray(target.users)).toBe(true);
  });

  it("setIn keeps an object for the string '0' (the React FAQ: use a string to keep an object)", () => {
    const target: Record<string, unknown> = {};
    setIn(target, ['map', '0', 'name'], 'x');
    expect(Array.isArray(target.map)).toBe(false);
    expect(target).toEqual({ map: { '0': { name: 'x' } } });
  });

  it('setIn replaces a value that is not a container and ignores an empty path', () => {
    const target: Record<string, unknown> = { a: 'text' };
    setIn(target, ['a', 'b'], 1);
    expect(target).toEqual({ a: { b: 1 } });
    setIn(target, [], 5);
    expect(target).toEqual({ a: { b: 1 } });
  });

  it('deleteIn removes a key, empties an array element, and ignores a missing path', () => {
    const target: Record<string, unknown> = { a: { b: 1, c: 2 }, list: ['x', 'y'] };
    deleteIn(target, ['a', 'b']);
    deleteIn(target, ['list', 0]);
    deleteIn(target, ['nothing', 'here']);
    deleteIn(target, []);
    expect(target.a).toEqual({ c: 2 });
    expect(target.list).toEqual([undefined, 'y']);
  });

  it('isPrefix tells a path from its start', () => {
    expect(isPrefix(['a'], ['a', 'b'])).toBe(true);
    expect(isPrefix(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isPrefix(['a', 'b'], ['a'])).toBe(false);
    expect(isPrefix(['b'], ['a', 'b'])).toBe(false);
    expect(isPrefix(['users', 0], ['users', '0', 'name'])).toBe(true);
  });

  it('clone copies plain objects, arrays and dates, and keeps functions and class instances', () => {
    class Box {}
    const fn = () => 1;
    const box = new Box();
    const date = new Date(0);
    const source = { a: [{ b: 1 }], d: date, fn, box };
    const copy = clone(source);
    expect(copy).toEqual(source);
    expect(copy.a).not.toBe(source.a);
    expect(copy.a[0]).not.toBe(source.a[0]);
    expect(copy.d).not.toBe(date);
    expect(copy.d.getTime()).toBe(0);
    expect(copy.fn).toBe(fn);
    expect(copy.box).toBe(box);
  });

  it('mergeDeep merges objects key by key and replaces arrays and other values', () => {
    const target: Record<string, unknown> = { user: { name: 'a', age: 1 }, tags: ['x', 'y'], keep: 1 };
    mergeDeep(target, { user: { age: 2 }, tags: ['z'], added: { deep: true } });
    expect(target).toEqual({ user: { name: 'a', age: 2 }, tags: ['z'], keep: 1, added: { deep: true } });
  });

  it('leafPaths of an empty value or a plain value at the root is empty', () => {
    expect(leafPaths({})).toEqual([]);
    expect(leafPaths(5)).toEqual([]);
    expect(leafPaths(undefined)).toEqual([]);
  });

  it('leafPaths lists the leaves of a nested value', () => {
    expect(leafPaths({ a: 1, b: { c: 2, d: { e: 3 } }, f: [1, 2], g: {} })).toEqual([
      ['a'],
      ['b', 'c'],
      ['b', 'd', 'e'],
      ['f'],
      ['g']
    ]);
  });
});

describe('MODEL-5: fillMissing writes only where the target has nothing', () => {
  it('keeps the values that are there and fills the gaps, key by key through objects', () => {
    const target: Record<string, unknown> = { a: 1, b: undefined, user: { name: 'kept' }, list: ['own'] };
    fillMissing(target, { a: 2, b: 3, c: { deep: true }, user: { name: 'lost', city: 'Osh' }, list: ['other'] });
    expect(target).toEqual({ a: 1, b: 3, c: { deep: true }, user: { name: 'kept', city: 'Osh' }, list: ['own'] });
  });

  it('copies what it writes, so the target does not share the source', () => {
    const source = { user: { tags: ['x'] } };
    const target: Record<string, unknown> = {};
    fillMissing(target, source);
    (target.user as { tags: string[] }).tags.push('y');
    expect(source.user.tags).toEqual(['x']);
  });

  it('leaves a value that is not an object where the source has an object', () => {
    const target: Record<string, unknown> = { user: 'text' };
    fillMissing(target, { user: { name: 'a' } });
    expect(target.user).toBe('text');
  });
});

describe('MODEL-2: isEqual tells a change of a snapshot', () => {
  it('compares primitives, with NaN equal to NaN', () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual(1, 2)).toBe(false);
    expect(isEqual('a', 'a')).toBe(true);
    expect(isEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isEqual(0, -0)).toBe(true);
    expect(isEqual(null, undefined)).toBe(false);
    expect(isEqual(1, '1')).toBe(false);
  });

  it('compares dates by time', () => {
    expect(isEqual(new Date(5), new Date(5))).toBe(true);
    expect(isEqual(new Date(5), new Date(6))).toBe(false);
    expect(isEqual(new Date(5), 5)).toBe(false);
  });

  it('compares arrays by length and content', () => {
    expect(isEqual([1, [2]], [1, [2]])).toBe(true);
    expect(isEqual([1, 2], [1, 3])).toBe(false);
    expect(isEqual([1], [1, 2])).toBe(false);
    expect(isEqual([1], { 0: 1 })).toBe(false);
  });

  it('compares plain objects by keys and content', () => {
    expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it('values that are not plain are equal only when they are the same value', () => {
    class Box {}
    const box = new Box();
    expect(isEqual(box, box)).toBe(true);
    expect(isEqual(new Box(), new Box())).toBe(false);
  });
});

describe('FRULES-1 and FRULES-4: lookupRules finds the list at a path', () => {
  const rule = { required: true };

  it('a list at the end of the path, for a flat name and for a nested one', () => {
    const rules = { username: [rule], user: { city: [rule] } };
    expect(lookupRules(rules, ['username'])).toEqual([rule]);
    expect(lookupRules(rules, ['user', 'city'])).toEqual([rule]);
  });

  it('anything else is an empty list: no entry, an object, a list met halfway, no rules at all', () => {
    const rules = { username: { deeper: [rule] }, list: [rule] };
    expect(lookupRules(rules, ['missing'])).toEqual([]);
    expect(lookupRules(rules, ['username'])).toEqual([]);
    expect(lookupRules(rules, ['list', 'name'])).toEqual([]);
    expect(lookupRules(rules, ['list', 0])).toEqual([]);
    expect(lookupRules(undefined, ['username'])).toEqual([]);
  });
});
