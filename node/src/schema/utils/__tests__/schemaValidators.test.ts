import {Validator} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import {AdminValidatorProvider} from '@schema/providers/types';
import {FieldSchema} from '@schema/types';
import {buildSchemaValidators} from '../schemaValidators';

const buildSchema = (validators?: FieldSchema['options']): FieldSchema =>
  ({
    name: 'value',
    type: 'string',
    options: validators,
  }) as FieldSchema;

const build = (schema: FieldSchema, provider?: AdminValidatorProvider) =>
  buildSchemaValidators(schema, defaultValidatorProvider, provider);

const runAll = (schema: FieldSchema, value: unknown, provider?: AdminValidatorProvider) =>
  build(schema, provider)
    .map((validator) => validator(value, {}, {}))
    .filter(Boolean);

describe('buildSchemaValidators (default provider)', () => {
  it('returns no validators without options', () => {
    expect(build(buildSchema())).toEqual([]);
  });

  it('returns no validators without the validators key', () => {
    expect(build(buildSchema({}))).toEqual([]);
  });

  it('maps max_length', () => {
    const schema = buildSchema({validators: [{type: 'max_length', value: 5}]});
    expect(runAll(schema, 'abcdef')).toHaveLength(1);
    expect(runAll(schema, 'abc')).toHaveLength(0);
  });

  it('maps min_length', () => {
    const schema = buildSchema({validators: [{type: 'min_length', value: 3}]});
    expect(runAll(schema, 'ab')).toHaveLength(1);
    expect(runAll(schema, 'abc')).toHaveLength(0);
  });

  it('maps max_value', () => {
    const schema = buildSchema({validators: [{type: 'max_value', value: 10}]});
    expect(runAll(schema, 11)).toHaveLength(1);
    expect(runAll(schema, 10)).toHaveLength(0);
  });

  it('maps min_value', () => {
    const schema = buildSchema({validators: [{type: 'min_value', value: 1}]});
    expect(runAll(schema, 0)).toHaveLength(1);
    expect(runAll(schema, 1)).toHaveLength(0);
  });

  it('accepts zero as a bound', () => {
    const schema = buildSchema({validators: [{type: 'min_value', value: 0}]});
    expect(runAll(schema, -1)).toHaveLength(1);
    expect(runAll(schema, 0)).toHaveLength(0);
  });

  it('tolerates bounds above Number.MAX_SAFE_INTEGER', () => {
    // JSON.parse turns the backend's 9223372036854775807 into this imprecise double
    const schema = buildSchema({validators: [{type: 'max_value', value: 9.223372036854776e18}]});
    expect(runAll(schema, 5)).toHaveLength(0);
  });

  it('maps a custom message for a non-regex rule', () => {
    const schema = buildSchema({
      validators: [{type: 'max_length', value: 5, message: 'Too long.'}],
    });
    const errors = runAll(schema, 'abcdef');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({message: 'Too long.'});
  });

  it('uses the default translation key without a custom message for a non-regex rule', () => {
    const schema = buildSchema({validators: [{type: 'min_value', value: 1}]});
    const errors = runAll(schema, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({message: 'ra.validation.minValue'});
  });

  it('maps regex with a custom message', () => {
    const schema = buildSchema({
      validators: [{type: 'regex', value: '^\\d{3} ?\\d{2}$', message: 'Invalid ZIP.'}],
    });
    expect(runAll(schema, '123 45')).toHaveLength(0);
    expect(runAll(schema, '12345')).toHaveLength(0);
    const errors = runAll(schema, 'abc');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({message: 'Invalid ZIP.'});
  });

  it('uses a generic format message without a custom regex message', () => {
    const schema = buildSchema({validators: [{type: 'regex', value: '^[a-z]+$'}]});
    const errors = runAll(schema, '123');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({message: 'ra.validation.invalid_format'});
  });

  it.each([
    ['without', undefined],
    ['with', 'Letters only.'],
  ])('returns a regex error %s a custom message that survives JSON', (_, message) => {
    // `useInput` serialises a validator's error to JSON before `ValidationError` translates it,
    // so its args must be plain data.
    const schema = buildSchema({validators: [{type: 'regex', value: '^[a-z]+$', message}]});
    const [error] = runAll(schema, '123');
    expect(JSON.parse(JSON.stringify(error))).toEqual(error);
  });

  it('skips a regex pattern that is not JavaScript-compatible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const schema = buildSchema({
      validators: [
        {type: 'regex', value: '(?P<name>abc)'},
        {type: 'max_length', value: 5},
      ],
    });
    expect(build(schema)).toHaveLength(1);
    expect(runAll(schema, 'abc')).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('leaves an oversized value to the backend instead of running the pattern on it', () => {
    const schema = buildSchema({validators: [{type: 'regex', value: '^[a-z]+$'}]});
    expect(runAll(schema, '1'.repeat(1000))).toHaveLength(1);
    expect(runAll(schema, '1'.repeat(1001))).toHaveLength(0);
  });

  it('ignores an unknown rule type', () => {
    const schema = buildSchema({
      validators: [
        // @ts-expect-error exercising forward-compatibility with a future rule type
        {type: 'some_future_rule', value: 1},
        {type: 'max_length', value: 5},
      ],
    });
    expect(build(schema)).toHaveLength(1);
  });

  it('ignores empty values (presence is enforced by required)', () => {
    const schema = buildSchema({
      validators: [
        {type: 'max_length', value: 5},
        {type: 'min_length', value: 3},
        {type: 'max_value', value: 10},
        {type: 'min_value', value: 1},
        {type: 'regex', value: '^\\d+$'},
      ],
    });
    expect(runAll(schema, undefined)).toHaveLength(0);
    expect(runAll(schema, null)).toHaveLength(0);
    expect(runAll(schema, '')).toHaveLength(0);
  });

  it('combines multiple rules', () => {
    const schema = buildSchema({
      validators: [
        {type: 'min_length', value: 3},
        {type: 'max_length', value: 5},
        {type: 'regex', value: '^[a-z]+$'},
      ],
    });
    expect(build(schema)).toHaveLength(3);
    expect(runAll(schema, 'ab')).toHaveLength(1);
    expect(runAll(schema, 'ABCD')).toHaveLength(1);
    expect(runAll(schema, 'abcd')).toHaveLength(0);
  });
});

describe('buildSchemaValidators (consumer validatorProvider)', () => {
  it('lets a provider add a validator for a new rule type', () => {
    const even: Validator = (value) =>
      typeof value === 'number' && value % 2 !== 0 ? 'Must be even.' : undefined;
    const provider: AdminValidatorProvider = ({rule}) =>
      // @ts-expect-error exercising a custom rule type the backend may introduce
      rule.type === 'even' ? even : undefined;

    const schema = buildSchema({
      // @ts-expect-error custom rule type
      validators: [{type: 'even', value: true}],
    });

    expect(build(schema, provider)).toHaveLength(1);
    expect(runAll(schema, 3, provider)).toHaveLength(1);
    expect(runAll(schema, 4, provider)).toHaveLength(0);
  });

  it('lets a provider override a built-in rule', () => {
    const provider: AdminValidatorProvider = ({rule}) =>
      rule.type === 'max_length'
        ? (value) =>
            typeof value === 'string' && value.length > (rule.value as number)
              ? 'Custom too long.'
              : undefined
        : undefined;

    const schema = buildSchema({validators: [{type: 'max_length', value: 3}]});
    const errors = runAll(schema, 'abcd', provider);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('Custom too long.');
  });

  it('falls back to the default when the provider returns undefined', () => {
    const provider: AdminValidatorProvider = () => undefined;
    const schema = buildSchema({validators: [{type: 'max_length', value: 3}]});
    expect(runAll(schema, 'abcd', provider)).toHaveLength(1);
  });

  it('suppresses a rule when the provider returns null', () => {
    const provider: AdminValidatorProvider = ({rule}) =>
      rule.type === 'max_length' ? null : undefined;
    const schema = buildSchema({
      validators: [
        {type: 'max_length', value: 3},
        {type: 'min_length', value: 2},
      ],
    });
    // max_length is suppressed (not even falling back to the default); min_length still applies.
    expect(build(schema, provider)).toHaveLength(1);
    expect(runAll(schema, 'abcd', provider)).toHaveLength(0);
    expect(runAll(schema, 'a', provider)).toHaveLength(1);
  });
});
