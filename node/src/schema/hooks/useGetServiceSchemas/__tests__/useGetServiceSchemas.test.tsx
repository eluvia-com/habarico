import React, {ReactNode} from 'react';
import {UserIdentity} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {SchemaProvider} from '@schema/providers/types';
import {ServiceSchema} from '@schema/types';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react';
import {useGetServiceSchemas} from '../useGetServiceSchemas';

const serviceConfigMap = {
  eshop: {url: 'https://api.example.com/api/v1/eshop/admin', label: 'E-shop'},
};

const buildSchemaProvider = () =>
  ({getServiceSchema: vi.fn().mockResolvedValue([])}) as unknown as SchemaProvider & {
    getServiceSchema: ReturnType<typeof vi.fn>;
  };

const renderSchemas = (props: {identity?: UserIdentity; isAuthenticated?: () => boolean}) => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  const schemaProvider = buildSchemaProvider();
  const wrapper = ({children}: {children: ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    ({identity, isAuthenticated}: typeof props) =>
      useGetServiceSchemas(serviceConfigMap, schemaProvider, 'en', identity, isAuthenticated),
    {wrapper, initialProps: props}
  );
  return {...hook, queryClient, schemaProvider};
};

describe('useGetServiceSchemas', () => {
  it('fetches the schemas of a signed-in user', async () => {
    const {result, schemaProvider} = renderSchemas({
      identity: {id: 'user-a'},
      isAuthenticated: () => true,
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(schemaProvider.getServiceSchema).toHaveBeenCalledTimes(1);
  });

  it('does not fetch without an identity', async () => {
    const {result, schemaProvider} = renderSchemas({});

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(schemaProvider.getServiceSchema).not.toHaveBeenCalled();
    expect(result.current.isLoaded).toBe(false);
  });

  it('does not fetch while the auth provider reports nobody signed in', async () => {
    const {result, schemaProvider} = renderSchemas({
      identity: {id: 'user-a'},
      isAuthenticated: () => false,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(schemaProvider.getServiceSchema).not.toHaveBeenCalled();
    expect(result.current.isLoaded).toBe(false);
  });

  // React Admin clears the shared query cache on logout; the next render must not refetch.
  it('does not refetch after a sign-out clears the query cache', async () => {
    let signedIn = true;
    const isAuthenticated = () => signedIn;
    const {result, rerender, queryClient, schemaProvider} = renderSchemas({
      identity: {id: 'user-a'},
      isAuthenticated,
    });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    signedIn = false;
    queryClient.clear();
    rerender({identity: undefined, isAuthenticated});
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(schemaProvider.getServiceSchema).toHaveBeenCalledTimes(1);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.servicesSchema).toEqual({});
  });

  it('does not refetch after a sign-out that still reports the last identity', async () => {
    let signedIn = true;
    const isAuthenticated = () => signedIn;
    const {result, rerender, queryClient, schemaProvider} = renderSchemas({
      identity: {id: 'user-a'},
      isAuthenticated,
    });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    signedIn = false;
    queryClient.clear();
    rerender({identity: {id: 'user-a'}, isAuthenticated});
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(schemaProvider.getServiceSchema).toHaveBeenCalledTimes(1);
  });

  it('fills each service into the references of its own schema', async () => {
    const serviceSchema = (resource: string) =>
      [
        {
          name: 'course',
          pkFieldName: 'id',
          label: 'Course',
          url: '',
          actions: [],
          views: [
            {
              name: 'list',
              type: 'list',
              isDetail: false,
              endpoint: {method: 'get', reference: {resource}},
            },
          ],
        },
      ] as unknown as ServiceSchema;
    const schemaProvider = {
      getServiceSchema: vi.fn((name: string) =>
        Promise.resolve(serviceSchema(name === 'school' ? 'lesson' : 'book'))
      ),
    } as unknown as SchemaProvider;

    const wrapper = ({children}: {children: ReactNode}) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    );
    const {result} = renderHook(
      () =>
        useGetServiceSchemas(
          {school: {url: 'https://api.test/school'}, library: {url: 'https://api.test/library'}},
          schemaProvider,
          'en',
          {id: 1}
        ),
      {wrapper}
    );

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.servicesSchema.school[0].views[0].endpoint.reference).toEqual({
      service: 'school',
      resource: 'lesson',
    });
    expect(result.current.servicesSchema.library[0].views[0].endpoint.reference).toEqual({
      service: 'library',
      resource: 'book',
    });
  });
});
