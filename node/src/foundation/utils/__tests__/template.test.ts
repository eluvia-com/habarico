import {describe, expect, it} from 'vitest';
import {templateToStr} from '../template';

describe('templateToStr', () => {
  it('returns undefined for undefined input', () => {
    expect(templateToStr(undefined, {})).toBeUndefined();
  });

  it('returns string unchanged when no placeholders', () => {
    expect(templateToStr('hello world', {})).toBe('Hello world');
  });

  it('replaces %{field} with data value', () => {
    // upperFirst applies to the template text itself; '%' is not a letter so no capitalization
    expect(templateToStr('%{name}', {name: 'hello'})).toBe('hello');
  });

  it('applies upperFirst to leading text before placeholder', () => {
    expect(templateToStr('name: %{name}', {name: 'test'})).toBe('Name: test');
  });

  it('handles nested paths %{user.email}', () => {
    // upperFirst applies to template string: '%{user.email}' starts with '%', no change
    expect(templateToStr('%{user.email}', {user: {email: 'a@b.com'}})).toBe('a@b.com');
  });

  it('applies upperFirst by default', () => {
    expect(templateToStr('hello', {})).toBe('Hello');
  });

  it('skips upperFirst when disabled', () => {
    expect(templateToStr('hello', {}, {upperFirst: false})).toBe('hello');
  });

  it('replaces missing keys with empty string', () => {
    expect(templateToStr('%{missing}', {})).toBe('');
  });

  it('replaces multiple placeholders', () => {
    expect(
      templateToStr('%{first} %{last}', {first: 'john', last: 'doe'}, {upperFirst: false})
    ).toBe('john doe');
  });
});
