import {describe, expect, it, vi} from 'vitest';
import {HabRecord, RecordMeta} from '@schema/types';
import {renderHook} from '@testing-library/react';
import {useHabRecordContext} from '../useHabRecordContext';

const contextHolder = vi.hoisted(() => ({record: undefined as unknown}));

vi.mock('react-admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-admin')>()),
  useRecordContext: () => contextHolder.record,
}));

vi.mock('@admin/contexts/ResourceContext', () => ({
  useResourceContext: () => 'school/student',
}));

const meta = (resourceName: string): RecordMeta => ({
  schema: {name: resourceName, pkFieldName: 'id', actions: []},
  repr: 'Zoë Müller',
  tags: [],
});

describe('useHabRecordContext', () => {
  it('returns the record of the resource the context is on', () => {
    const record: HabRecord = {id: 1, meta: meta('student')};
    contextHolder.record = record;

    expect(renderHook(() => useHabRecordContext()).result.current).toBe(record);
  });

  it('reports no record when the context holds one of another resource', () => {
    contextHolder.record = {id: 1, meta: meta('teacher')} satisfies HabRecord;

    expect(renderHook(() => useHabRecordContext()).result.current).toBeUndefined();
  });

  // React Admin's context is typed by the caller, so a record put there by a hand-mounted
  // `RecordContextProvider` need not carry `meta`. Handing it on would break every consumer reading
  // `meta` as the non-optional field its type declares.
  it('reports no record for one that carries no meta', () => {
    contextHolder.record = {id: 1};

    expect(renderHook(() => useHabRecordContext()).result.current).toBeUndefined();
  });

  it('reports no record when the context holds none', () => {
    contextHolder.record = undefined;

    expect(renderHook(() => useHabRecordContext()).result.current).toBeUndefined();
  });
});
