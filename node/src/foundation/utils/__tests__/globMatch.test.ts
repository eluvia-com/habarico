import {describe, expect, it} from 'vitest';
import {matchesAnyGlob} from '@foundation/utils/globMatch';

describe('matchesAnyGlob', () => {
  it('matches an exact pattern with no wildcards', () => {
    expect(matchesAnyGlob('dashboard', ['dashboard'])).toBe(true);
  });

  it('returns false when no pattern matches', () => {
    expect(matchesAnyGlob('theme', ['dashboard', '*.columns'])).toBe(false);
  });

  it('treats * as one or more chars excluding dot', () => {
    expect(matchesAnyGlob('shop_orders.columns', ['*.columns'])).toBe(true);
    expect(matchesAnyGlob('auth_users.columns', ['*.columns'])).toBe(true);
  });

  it('does not let * cross a dot boundary', () => {
    expect(matchesAnyGlob('shop.orders.columns', ['*.columns'])).toBe(false);
  });

  it('requires the wildcard to match at least one character', () => {
    expect(matchesAnyGlob('.columns', ['*.columns'])).toBe(false);
  });

  it('escapes regex metacharacters in the literal portion of the pattern', () => {
    expect(matchesAnyGlob('a.b', ['a.b'])).toBe(true);
    expect(matchesAnyGlob('axb', ['a.b'])).toBe(false);
  });

  it('matches when any of multiple patterns matches', () => {
    expect(matchesAnyGlob('dashboard', ['dashboard', '*.columns'])).toBe(true);
  });

  it('returns false for an empty pattern list', () => {
    expect(matchesAnyGlob('dashboard', [])).toBe(false);
  });
});
