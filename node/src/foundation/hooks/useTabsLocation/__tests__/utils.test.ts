import {describe, expect, it} from 'vitest';
import {parseTabsFromHash, stringifyTabsToHash} from '../utils';

describe('parseTabsFromHash', () => {
  it('returns empty array for empty hash', () => {
    expect(parseTabsFromHash('')).toEqual([]);
  });

  it('returns empty array for null-like input', () => {
    expect(parseTabsFromHash('#')).toEqual([]);
  });

  it('parses single tab', () => {
    expect(parseTabsFromHash('#tabs=detail')).toEqual(['detail']);
  });

  it('parses multiple tabs', () => {
    expect(parseTabsFromHash('#tabs=detail,info')).toEqual(['detail', 'info']);
  });

  it('parses without leading #', () => {
    expect(parseTabsFromHash('tabs=detail')).toEqual(['detail']);
  });

  it('trims whitespace from tab names', () => {
    expect(parseTabsFromHash('#tabs=detail, info')).toEqual(['detail', 'info']);
  });

  it('handles URL-encoded tab names', () => {
    const hash = stringifyTabsToHash(['some.nested.tab']);
    expect(parseTabsFromHash(hash)).toEqual(['some.nested.tab']);
  });
});

describe('stringifyTabsToHash', () => {
  it('returns empty string for empty array', () => {
    expect(stringifyTabsToHash([])).toBe('');
  });

  it('encodes single tab', () => {
    expect(stringifyTabsToHash(['detail'])).toBe('#tabs=detail');
  });

  it('encodes multiple tabs joined with comma', () => {
    expect(stringifyTabsToHash(['detail', 'info'])).toBe('#tabs=detail,info');
  });

  it('URL-encodes tab names with special characters', () => {
    const result = stringifyTabsToHash(['some.nested.tab']);
    expect(result).toBe('#tabs=some.nested.tab');
  });
});
