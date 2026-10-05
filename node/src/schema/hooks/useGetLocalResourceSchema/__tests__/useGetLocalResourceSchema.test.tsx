import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {BoxSchema, LocalResourceSchema, ResourceReference} from '@schema/types';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react';
import {useGetLocalResourceSchema} from '../useGetLocalResourceSchema';

const contextHolder = vi.hoisted(() => ({
  isLoaded: true,
  servicesSchema: {
    school: [{name: 'course', pkFieldName: 'id', url: 'https://api.test/course/', views: []}],
  },
  schemaProvider: {getRecordSchema: vi.fn()},
}));

vi.mock('@schema/contexts/SchemaRootContext/useSchemaRootContext', () => ({
  useSchemaRootContext: () => contextHolder,
}));

vi.mock('react-admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-admin')>()),
  useGetIdentity: () => ({identity: {id: 1}}),
  useLocaleState: () => ['en'],
  useResourceContext: (props?: {resource?: string}) => props?.resource,
}));

const schemaWithReference = (reference: ResourceReference): LocalResourceSchema => {
  const box: BoxSchema = {name: 'students', type: 'list', readOnly: false, list: {reference}};
  return {
    name: 'course',
    pkFieldName: 'id',
    actions: [],
    endpoints: {} as LocalResourceSchema['endpoints'],
    url: 'https://api.test/course/',
    views: [{name: 'show', type: 'show', isDetail: true, endpoint: {method: 'get'}, detail: {box}}],
  };
};

const listReference = (schema: LocalResourceSchema | undefined) =>
  schema?.views[0].detail?.box.list?.reference;

const wrapper = ({children}: {children: React.ReactNode}) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useGetLocalResourceSchema', () => {
  it('fills the service of the resource into a fetched schema', async () => {
    contextHolder.schemaProvider.getRecordSchema.mockResolvedValue(
      schemaWithReference({resource: 'student'} as ResourceReference)
    );

    const {result} = renderHook(() => useGetLocalResourceSchema({resource: 'school/course'}), {
      wrapper,
    });

    await waitFor(() => expect(result.current.schema).toBeDefined());
    expect(listReference(result.current.schema)).toEqual({service: 'school', resource: 'student'});
  });

  it('fills the service of the resource into a schema handed in', () => {
    const schema = schemaWithReference({resource: 'student'} as ResourceReference);

    const {result} = renderHook(
      () => useGetLocalResourceSchema({resource: 'school/course', schema}),
      {wrapper}
    );

    expect(listReference(result.current.schema)).toEqual({service: 'school', resource: 'student'});
    expect(listReference(schema)).toEqual({resource: 'student'});
  });

  it('returns a schema handed in unchanged when every reference names its service', () => {
    const schema = schemaWithReference({service: 'library', resource: 'book'});

    const {result} = renderHook(
      () => useGetLocalResourceSchema({resource: 'school/course', schema}),
      {wrapper}
    );

    expect(result.current.schema).toBe(schema);
  });

  it('reports an error for a schema handed in without a service to resolve it against', () => {
    const schema = schemaWithReference({resource: 'student'} as ResourceReference);

    const {result} = renderHook(() => useGetLocalResourceSchema({schema}), {wrapper});

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('accepts a schema handed in without a resource when its references name their service', () => {
    const schema = schemaWithReference({service: 'library', resource: 'book'});

    const {result} = renderHook(() => useGetLocalResourceSchema({schema}), {wrapper});

    expect(result.current.isError).toBe(false);
    expect(result.current.schema).toBe(schema);
  });
});
