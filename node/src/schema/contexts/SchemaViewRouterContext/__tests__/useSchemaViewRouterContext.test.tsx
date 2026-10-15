import React, {ReactNode} from 'react';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {SchemaViewRouterContextProvider} from '../SchemaViewRouterContextProvider';
import {SchemaViewRouterContextProps} from '../types';
import {useSchemaViewRouterContext} from '../useSchemaViewRouterContext';

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  getLink: vi.fn(() => '/svc/res/1/show'),
}));

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return {...actual, useNavigate: () => h.navigate};
});

vi.mock('@admin/hooks/useGetLinkWithData', () => ({useGetLinkWithData: () => h.getLink}));

// The surface the hook is read on: a bare router (a page, no provider) or one that mounts a
// provider carrying the given context.
const wrapper = (context?: SchemaViewRouterContextProps) => {
  const Wrapper = ({children}: {children: ReactNode}) => (
    <MemoryRouter>
      {context ? (
        <SchemaViewRouterContextProvider context={context}>
          {children}
        </SchemaViewRouterContextProvider>
      ) : (
        children
      )}
    </MemoryRouter>
  );
  return Wrapper;
};

const target = {resource: 'svc/res', viewName: 'show', viewType: 'show', id: 1} as const;

beforeEach(() => vi.clearAllMocks());

describe('useSchemaViewRouterContext - navigation is always callable', () => {
  it('navigates when no provider is mounted (a page surface)', () => {
    const {result} = renderHook(() => useSchemaViewRouterContext(), {wrapper: wrapper()});

    expect(result.current.changeView(target)).toBe(true);
    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show', {replace: false});
  });

  it('uses the in-place navigation a provider supplies', () => {
    const changeView = vi.fn(() => true);
    const {result} = renderHook(() => useSchemaViewRouterContext(), {
      wrapper: wrapper({resource: 'svc/res', viewName: 'show', viewType: 'show', changeView}),
    });

    expect(result.current.changeView(target)).toBe(true);
    expect(changeView).toHaveBeenCalledWith(target);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('falls back to the routed navigation when a provider carries only a position', () => {
    // `SchemaViewRouterContextProps` leaves `changeView` / `prevView` optional, so a provider may
    // describe where we are without saying how to move. Callers must still get a callable function
    // rather than a non-null assertion that blows up at runtime.
    const {result} = renderHook(() => useSchemaViewRouterContext(), {
      wrapper: wrapper({resource: 'svc/res', viewName: 'show', viewType: 'show'}),
    });

    expect(result.current.changeView(target)).toBe(true);
    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show', {replace: false});
  });

  it('falls back when a provider spells the navigation out as undefined', () => {
    // The spread of the provider's value only wins for keys it actually carries, so this is the
    // case the fallback misses today: the key is present and undefined, which overwrites it and
    // leaves callers with a non-function.
    const {result} = renderHook(() => useSchemaViewRouterContext(), {
      wrapper: wrapper({
        resource: 'svc/res',
        viewName: 'show',
        viewType: 'show',
        changeView: undefined,
        prevView: undefined,
      }),
    });

    expect(result.current.changeView(target)).toBe(true);
    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show', {replace: false});
  });

  it('offers no overlay to close when no provider is mounted', () => {
    // A page has no overlay, so a caller that navigates has nothing to close - and must not be
    // handed `prevView`, whose page meaning is a *navigation* of its own.
    const {result} = renderHook(() => useSchemaViewRouterContext(), {wrapper: wrapper()});

    expect(result.current.closeOverlay).toBeUndefined();
  });

  it('passes through the overlay close a provider supplies', () => {
    const closeOverlay = vi.fn();
    const {result} = renderHook(() => useSchemaViewRouterContext(), {
      wrapper: wrapper({resource: 'svc/res', viewName: 'show', viewType: 'show', closeOverlay}),
    });

    result.current.closeOverlay?.();

    expect(closeOverlay).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('falls back to the routed prev navigation the same way', () => {
    const {result} = renderHook(() => useSchemaViewRouterContext(), {
      wrapper: wrapper({resource: 'svc/res', viewName: 'show', viewType: 'show'}),
    });

    expect(result.current.prevView()).toBe(true);
    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
  });
});
