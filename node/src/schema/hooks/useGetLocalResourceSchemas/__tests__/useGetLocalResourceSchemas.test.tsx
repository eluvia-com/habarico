import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react';
import {useGetLocalResourceSchemas} from '../useGetLocalResourceSchemas';

const h = vi.hoisted(() => ({
  getRecordSchema: vi.fn(),
  servicesSchema: {
    billing: [{name: 'invoice', pkFieldName: 'id', url: 'https://api.test/invoice/', views: []}],
  },
}));

vi.mock('@schema/contexts/SchemaRootContext/useSchemaRootContext', () => ({
  useSchemaRootContext: () => ({
    isLoaded: true,
    servicesSchema: h.servicesSchema,
    schemaProvider: {getRecordSchema: h.getRecordSchema},
  }),
}));

vi.mock('react-admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-admin')>()),
  useGetIdentity: () => ({identity: {id: 1}}),
  useLocaleState: () => ['en'],
}));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const invoice = {service: 'billing', resource: 'invoice'};
const invoiceSchema = {
  name: 'invoice',
  pkFieldName: 'id',
  views: [],
  endpoints: {},
  url: '',
  actions: [{name: 'approve', type: 'resource', isDetail: false}],
};

describe('useGetLocalResourceSchemas', () => {
  it('loads a reference given twice once and serves its schema', async () => {
    h.getRecordSchema.mockReset().mockResolvedValue(invoiceSchema);
    const references = [invoice, {...invoice}];

    const {result} = renderHook(() => useGetLocalResourceSchemas({references}), {wrapper});

    expect(result.current(invoice).isLoading).toBe(true);
    await waitFor(() => expect(result.current(invoice).schema).toBeDefined());
    expect(result.current(invoice).schema?.actions?.map((action) => action.name)).toEqual([
      'approve',
    ]);
    expect(h.getRecordSchema).toHaveBeenCalledTimes(1);
    expect(h.getRecordSchema).toHaveBeenCalledWith(
      'https://api.test/invoice/',
      undefined,
      undefined,
      expect.anything()
    );
  });

  it('asks for the record and the action schema the reference names', async () => {
    h.getRecordSchema.mockReset().mockResolvedValue(invoiceSchema);
    const reference = {...invoice, recordPk: 3, actionName: 'pay', params: {_target: 'x'}};

    const {result} = renderHook(() => useGetLocalResourceSchemas({references: [reference]}), {
      wrapper,
    });

    await waitFor(() => expect(result.current(reference).schema).toBeDefined());
    expect(h.getRecordSchema).toHaveBeenCalledWith(
      'https://api.test/invoice/',
      'pay',
      3,
      expect.objectContaining({params: {_target: 'x'}})
    );
  });

  it('reports a resource missing from the service schemas as failed, not loading', () => {
    h.getRecordSchema.mockReset();
    const reference = {service: 'billing', resource: 'missing'};

    const {result} = renderHook(() => useGetLocalResourceSchemas({references: [reference]}), {
      wrapper,
    });

    expect(result.current(reference)).toEqual({
      schema: undefined,
      isLoading: false,
      isError: true,
    });
    expect(h.getRecordSchema).not.toHaveBeenCalled();
  });
});
