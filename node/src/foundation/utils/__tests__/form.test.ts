import {describe, expect, it} from 'vitest';
import {omitDeepByValues} from '@foundation/utils/form';

describe('omitDeepByValues', () => {
  it('returns entire defaults when values is undefined', () => {
    expect(omitDeepByValues({a: 1, b: 2})).toEqual({a: 1, b: 2});
  });

  it('omits a key that exists in values', () => {
    expect(omitDeepByValues({a: 1, b: 2}, {a: 99})).toEqual({b: 2});
  });

  it('keeps a key that does not exist in values', () => {
    expect(omitDeepByValues({a: 1, b: 2}, {c: 99})).toEqual({a: 1, b: 2});
  });

  it('recurses into nested plain objects', () => {
    expect(omitDeepByValues({a: {x: 1, y: 2}}, {a: {x: 99}})).toEqual({a: {y: 2}});
  });

  it('omits nested object entirely when all nested keys are present in values', () => {
    expect(omitDeepByValues({a: {x: 1}}, {a: {x: 99}})).toEqual({});
  });

  it('keeps only missing keys in a partially matching nested object', () => {
    expect(omitDeepByValues({a: {x: 1, y: 2, z: 3}}, {a: {x: 99, y: 99}})).toEqual({a: {z: 3}});
  });

  it('ignores extra keys in values that are not in defaults', () => {
    expect(omitDeepByValues({a: 1}, {a: 99, b: 99})).toEqual({});
    expect(omitDeepByValues({a: 1}, {b: 99})).toEqual({a: 1});
  });

  it('treats arrays as non-plain-objects and omits the key when present in values', () => {
    expect(omitDeepByValues({a: [1, 2, 3]}, {a: [4, 5, 6]})).toEqual({});
    expect(omitDeepByValues({a: [1, 2, 3]}, {})).toEqual({a: [1, 2, 3]});
  });

  it('returns empty object when defaults is empty', () => {
    expect(omitDeepByValues({}, {a: 1})).toEqual({});
  });
});
