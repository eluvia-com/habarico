import {describe, expect, it} from 'vitest';
import {BoxSchema} from '@schema/types';
import {
  createConditionFunction,
  extractErrorMessage,
  hasFieldDescriptors,
  snakeCaseToCamelCase,
} from '../api';

describe('snakeCaseToCamelCase', () => {
  it('converts top-level keys', () => {
    expect(snakeCaseToCamelCase({my_key: 1}, [])).toEqual({myKey: 1});
  });

  it('recurses into nested objects', () => {
    expect(snakeCaseToCamelCase({outer_key: {inner_key: 2}}, [])).toEqual({
      outerKey: {innerKey: 2},
    });
  });

  it('recurses into arrays', () => {
    expect(snakeCaseToCamelCase([{my_key: 1}], [])).toEqual([{myKey: 1}]);
  });

  it('ignores specified keys', () => {
    expect(snakeCaseToCamelCase({my_key: 1, raw_field: 2}, ['rawField'])).toEqual({
      myKey: 1,
      rawField: 2,
    });
  });

  it('passes through primitives unchanged', () => {
    expect(snakeCaseToCamelCase(42, [])).toBe(42);
    expect(snakeCaseToCamelCase('str', [])).toBe('str');
    expect(snakeCaseToCamelCase(null, [])).toBeNull();
  });

  it('leaves a key holding a run of underscores verbatim', () => {
    expect(snakeCaseToCamelCase({created_at__gte: 1}, [])).toEqual({created_at__gte: 1});
  });

  it('leaves a key with a leading underscore verbatim', () => {
    expect(snakeCaseToCamelCase({_target: 1}, [])).toEqual({_target: 1});
  });

  it('leaves a key that is not plain snake_case verbatim', () => {
    expect(snakeCaseToCamelCase({'a_ b': 1, a_é: 2}, [])).toEqual({'a_ b': 1, a_é: 2});
  });

  it('reads only own properties of the input', () => {
    const input = Object.create({inherited_key: 1});
    input.own_key = 2;
    expect(snakeCaseToCamelCase(input, [])).toEqual({ownKey: 2});
  });

  it('does not collapse an underscore run into the __proto__ key', () => {
    const result = snakeCaseToCamelCase(JSON.parse('{"____proto____": {"polluted": true}}'), []);

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.polluted).toBeUndefined();
  });

  it('drops a __proto__ key instead of assigning it', () => {
    const result = snakeCaseToCamelCase(
      JSON.parse('{"__proto__": {"polluted": true}, "my_key": 1}'),
      []
    );

    expect(result).toEqual({myKey: 1});
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('drops a nested __proto__ key', () => {
    const result = snakeCaseToCamelCase(
      JSON.parse('{"outer_key": {"__proto__": {"polluted": true}, "inner_key": 1}}'),
      []
    );

    expect(result.outerKey).toEqual({innerKey: 1});
    expect(Object.getPrototypeOf(result.outerKey)).toBe(Object.prototype);
  });
});

describe('extractErrorMessage', () => {
  it('returns string errors directly', () => {
    expect(extractErrorMessage('something went wrong')).toBe('something went wrong');
  });

  it('returns message from error object', () => {
    expect(extractErrorMessage(new Error('fail'))).toBe('fail');
  });

  it('returns undefined for undefined input', () => {
    expect(extractErrorMessage(undefined)).toBeUndefined();
  });

  it('returns undefined for object without message', () => {
    expect(extractErrorMessage({})).toBeUndefined();
  });
});

describe('hasFieldDescriptors', () => {
  const box = (name: string): BoxSchema => ({name, type: 'simple', readOnly: false});

  it('is true for a box holding a field directly', () => {
    expect(hasFieldDescriptors([{type: 'field', name: 'price'}, box('photos')])).toBe(true);
  });

  it('is false for a box that only wraps other boxes', () => {
    expect(hasFieldDescriptors([box('address'), box('photos')])).toBe(false);
  });

  it('is false for a box with no children at all', () => {
    expect(hasFieldDescriptors()).toBe(false);
  });
});

describe('createConditionFunction', () => {
  it('evaluates simple equality expression', () => {
    const fn = createConditionFunction('status === "active"');
    expect(fn({status: 'active'})).toBe(true);
    expect(fn({status: 'inactive'})).toBe(false);
  });

  it('evaluates expression with nested path', () => {
    const fn = createConditionFunction('user.role === "admin"');
    expect(fn({user: {role: 'admin'}})).toBe(true);
    expect(fn({user: {role: 'user'}})).toBe(false);
  });

  it('throws on unsafe expression with backtick', () => {
    // Backtick is not in the allowed character set [-\w\s!=&|()."']
    expect(() => createConditionFunction('`shell command`')).toThrow('Invalid expression.');
  });

  it('throws on unsafe expression with semicolon', () => {
    expect(() => createConditionFunction('true; process.exit(1)')).toThrow('Invalid expression.');
  });

  it('returns false on evaluation error', () => {
    const fn = createConditionFunction('undefined_var === true');
    expect(fn({})).toBe(false);
  });

  it('evaluates non-ASCII string literals', () => {
    const fn = createConditionFunction('record.city == "Zürich"');
    expect(fn({record: {city: 'Zürich'}})).toBe(true);
    expect(fn({record: {city: 'London'}})).toBe(false);
  });

  it('throws on a function call expression (audit exploit)', () => {
    expect(() =>
      createConditionFunction('a == Function("document.title=document.cookie")()')
    ).toThrow('Invalid expression.');
  });

  it('throws on any call expression', () => {
    expect(() => createConditionFunction('foo()')).toThrow('Invalid expression.');
  });

  it('throws on prototype-chain path segments', () => {
    expect(() => createConditionFunction('constructor.constructor == "x"')).toThrow(
      'Invalid expression.'
    );
    expect(() => createConditionFunction('a.__proto__ == b')).toThrow('Invalid expression.');
    expect(() => createConditionFunction('a.prototype == b')).toThrow('Invalid expression.');
  });

  it('throws on computed member access', () => {
    expect(() => createConditionFunction('a["x"] == 1')).toThrow('Invalid expression.');
  });

  it('does not resolve identifiers against globals', () => {
    const fn = createConditionFunction('Math == 1');
    expect(fn({})).toBe(false);
    const fnData = createConditionFunction('Math == 1');
    expect(fnData({Math: 1})).toBe(true);
  });

  it('evaluates && and || with JavaScript precedence', () => {
    const fn = createConditionFunction('a || b && c');
    expect(fn({a: false, b: true, c: true})).toBe(true);
    expect(fn({a: false, b: true, c: false})).toBe(false);
    expect(fn({a: true, b: false, c: false})).toBe(true);
  });

  it('evaluates parentheses overriding precedence', () => {
    const fn = createConditionFunction('(a || b) && c');
    expect(fn({a: true, b: false, c: false})).toBe(false);
    expect(fn({a: true, b: false, c: true})).toBe(true);
  });

  it('evaluates unary negation', () => {
    const fn = createConditionFunction('!is_active');
    expect(fn({is_active: false})).toBe(true);
    expect(fn({is_active: true})).toBe(false);
  });

  it('evaluates a bare identifier as truthiness', () => {
    const fn = createConditionFunction('record.is_admin');
    expect(fn({record: {is_admin: true}})).toBe(true);
    expect(fn({record: {is_admin: false}})).toBe(false);
    expect(fn({})).toBe(false);
  });

  it('evaluates relational operators on numbers', () => {
    const fn = createConditionFunction('count >= 3');
    expect(fn({count: 3})).toBe(true);
    expect(fn({count: 2})).toBe(false);
  });

  it('distinguishes loose and strict equality', () => {
    expect(createConditionFunction('count == "3"')({count: 3})).toBe(true);
    expect(createConditionFunction('count === "3"')({count: 3})).toBe(false);
    expect(createConditionFunction('count != "3"')({count: 3})).toBe(false);
    expect(createConditionFunction('count !== "3"')({count: 3})).toBe(true);
  });

  it('evaluates null and undefined literals', () => {
    expect(createConditionFunction('value == null')({value: null})).toBe(true);
    expect(createConditionFunction('value === undefined')({})).toBe(true);
    expect(createConditionFunction('value === undefined')({value: 1})).toBe(false);
  });

  it('throws on arithmetic and other unsupported operators', () => {
    expect(() => createConditionFunction('a - b == 1')).toThrow('Invalid expression.');
  });

  it('throws on a ternary expression', () => {
    expect(() => createConditionFunction('a ? b : c')).toThrow('Invalid expression.');
  });

  it('throws on an empty expression', () => {
    expect(() => createConditionFunction('')).toThrow('Invalid expression.');
  });
});
