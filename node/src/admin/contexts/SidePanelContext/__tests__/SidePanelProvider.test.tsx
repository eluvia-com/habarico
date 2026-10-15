import React, {PropsWithChildren} from 'react';
import {describe, expect, it} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {SidePanelProvider, useSidePanelController} from '..';

const wrapper = ({children}: PropsWithChildren) => (
  <SidePanelProvider>{children}</SidePanelProvider>
);

// A minimal opaque payload — the admin controller is generic, so the test drives it with a
// plain id (mirroring the story ring) rather than a schema-specific view.
const view = (id: number) => id;

describe('SidePanelProvider / useSidePanelController', () => {
  it('starts closed (no active view)', () => {
    const {result} = renderHook(() => useSidePanelController<number>(), {wrapper});
    expect(result.current?.active).toBeUndefined();
  });

  it('openView sets the active view', () => {
    const {result} = renderHook(() => useSidePanelController<number>(), {wrapper});
    act(() => result.current!.openView(view(1)));
    expect(result.current?.active).toEqual(view(1));
  });

  it('openView replaces the active view (row switch swaps the preview)', () => {
    const {result} = renderHook(() => useSidePanelController<number>(), {wrapper});
    act(() => result.current!.openView(view(1)));
    act(() => result.current!.openView(view(2)));
    expect(result.current?.active).toBe(2);
  });

  it('close clears the active view', () => {
    const {result} = renderHook(() => useSidePanelController<number>(), {wrapper});
    act(() => result.current!.openView(view(1)));
    act(() => result.current!.close());
    expect(result.current?.active).toBeUndefined();
  });

  it('returns undefined when no provider is mounted', () => {
    const {result} = renderHook(() => useSidePanelController());
    expect(result.current).toBeUndefined();
  });
});
