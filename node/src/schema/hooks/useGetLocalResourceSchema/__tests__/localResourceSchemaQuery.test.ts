import {describe, expect, it, vi} from 'vitest';
import {SchemaProvider} from '@schema/providers/types';
import {hashKey} from '@tanstack/react-query';
import {localResourceSchemaQuery} from '../localResourceSchemaQuery';

const query = (params?: Record<string, string>) =>
  localResourceSchemaQuery({
    schemaProvider: {getRecordSchema: vi.fn()} as unknown as SchemaProvider,
    url: 'https://api.test/student/',
    resource: 'school/student',
    params,
    locale: 'en',
  });

describe('localResourceSchemaQuery', () => {
  // React Query hashes a key by sorting the keys of every plain object in it, so `params` has to
  // reach it as the object. Pre-stringifying it would hide it from that and fetch the same schema
  // once per order the query happened to arrive in.
  it('hashes to one key whatever order the params arrive in', () => {
    expect(hashKey(query({variant: 'full', _target: 'course_id'}).queryKey)).toBe(
      hashKey(query({_target: 'course_id', variant: 'full'}).queryKey)
    );
  });

  it('tells apart queries that differ in a param', () => {
    expect(hashKey(query({variant: 'full'}).queryKey)).not.toBe(
      hashKey(query({variant: 'short'}).queryKey)
    );
  });

  it('tells apart a query with no params from one carrying some', () => {
    expect(hashKey(query().queryKey)).not.toBe(hashKey(query({variant: 'full'}).queryKey));
  });
});
