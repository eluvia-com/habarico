import React from 'react';
import {ResourceContextProvider} from 'react-admin';
import {RouterProvider, createMemoryRouter, useNavigate} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';
import {ActionTriggerResult} from '@admin/components/buttons/types';
import {NavMode} from '@foundation/utils/navigation';
import {render, waitFor} from '@testing-library/react';
import {SchemaViewActionTrigger} from '../SchemaViewActionTrigger';

vi.mock('@admin/contexts/ViewPresentationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@admin/contexts/ViewPresentationContext')>()),
  useViewPresentation: () => ({presentation: 'page'}),
}));
vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({getGlobalViewSchema: () => ({mode: undefined})}),
}));
vi.mock('@admin/contexts/SidePanelContext', () => ({useSidePanelController: () => undefined}));
vi.mock('@admin/contexts/UnsavedChangesContext', () => ({
  useUnsavedChangesControl: () => ({getHasUnsavedChanges: () => false}),
}));
vi.mock('@admin/contexts/AdminConfigContext', () => ({useAdminConfig: () => ({})}));
vi.mock('@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext', () => ({
  useSchemaViewRouterContext: () => ({changeView: vi.fn(), closeOverlay: undefined}),
}));

const PARENT_PATH = '/system/product/P1/show';
const CREATE_PATH = `${PARENT_PATH}/n/reviews/system/review/create`;
const CREATED_PATH = '/system/review/R1/show';

type PageProps = {
  onDone: (result?: ActionTriggerResult) => void;
  replace?: boolean;
  navMode?: NavMode;
};

// Stands in for CreateContent after a successful save: the created review's own after-save redirect
// would go to its show view, while the backend's `trigger_action` points back at the parent product.
const CreatedReviewPage = ({onDone, replace, navMode}: PageProps) => {
  const navigate = useNavigate();
  return (
    <ResourceContextProvider value="system/review">
      <SchemaViewActionTrigger
        viewType="show"
        viewName="show"
        reference="system/product"
        recordPk="P1"
        replace={replace}
        navMode={navMode}
        onDone={(result) => {
          onDone(result);
          if (!result?.navigated) navigate(CREATED_PATH, {replace: true});
        }}
      />
    </ResourceContextProvider>
  );
};

const renderAtCreate = (props: PageProps) => {
  const router = createMemoryRouter(
    [
      {path: '*', element: <CreatedReviewPage {...props} />},
      {path: PARENT_PATH, element: null},
      {path: CREATED_PATH, element: null},
    ],
    {initialEntries: [PARENT_PATH, CREATE_PATH], initialIndex: 1}
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe('SchemaViewActionTrigger redirect', () => {
  it('reports that it navigated, so the caller skips its own after-save redirect', async () => {
    const onDone = vi.fn();
    const router = renderAtCreate({onDone});

    await waitFor(() => expect(router.state.location.pathname).toBe(PARENT_PATH));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith({navigated: true});
  });

  it('lands on the trigger target, not nested under the current route', async () => {
    const router = renderAtCreate({onDone: vi.fn()});

    await waitFor(() => expect(router.state.location.pathname).toBe(PARENT_PATH));
  });

  it('pushes a history entry by default', async () => {
    const router = renderAtCreate({onDone: vi.fn()});

    await waitFor(() => expect(router.state.location.pathname).toBe(PARENT_PATH));
    expect(router.state.historyAction).toBe('PUSH');
  });

  it('replaces the current history entry when asked to', async () => {
    const router = renderAtCreate({onDone: vi.fn(), replace: true});

    await waitFor(() => expect(router.state.location.pathname).toBe(PARENT_PATH));
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('does not report a navigation when the target opens in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const onDone = vi.fn();
    const router = renderAtCreate({onDone, navMode: 'tab'});

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(onDone).toHaveBeenCalledWith(undefined);
    expect(open).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe(CREATED_PATH);
    open.mockRestore();
  });
});
