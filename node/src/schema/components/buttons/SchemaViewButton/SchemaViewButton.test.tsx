import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SchemaViewButton} from './SchemaViewButton';

// Shared, mutable test state referenced from the (hoisted) module mocks.
const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  openDialog: vi.fn(),
  changeView: vi.fn(),
  closeOverlay: vi.fn(),
  prevView: vi.fn(),
  // Whether the overlay the trigger fires from was rendered by a `SchemaViewRouter`. The library's
  // own dialogs and panels always are; a `ViewDialog` mounted by hand is not, and then there is no
  // overlay close to be had.
  routedOverlay: true,
  // Whether the navigation was handled by a new tab/window (ctrl/cmd-click); the default is a
  // plain same-tab navigation.
  openByMode: false,
  getLink: vi.fn(() => '/svc/res/1/show'),
  presentation: 'page' as ViewPresentation,
  mode: undefined as string | undefined,
  sidePanel: undefined as {openView: ReturnType<typeof vi.fn>} | undefined,
}));

vi.mock('react-admin', async (orig) => {
  const actual = await orig<typeof import('react-admin')>();
  return {
    ...actual,
    useRecordContext: () => ({id: 1}),
    useResourceContext: (resource?: string) => resource ?? 'svc/res',
  };
});

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return {...actual, useNavigate: () => h.navigate};
});

vi.mock('@admin/hooks/useGetLinkWithData', () => ({
  useGetLinkWithData: () => h.getLink,
}));

vi.mock('@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext', () => ({
  useSchemaViewRouterContext: () => ({
    changeView: h.changeView,
    prevView: h.prevView,
    closeOverlay: h.routedOverlay ? h.closeOverlay : undefined,
  }),
}));

// Partial mock: only the surface flags are stubbed. The real `useOverlayPresentation` /
// `ViewPresentationProvider` are kept so `ViewDialog` (now the trigger's dialog surface) still works.
vi.mock('@admin/contexts/ViewPresentationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@admin/contexts/ViewPresentationContext')>()),
  useViewPresentation: () => ({
    presentation: h.presentation,
  }),
}));

vi.mock('@design/hooks/useDialog', () => ({
  useDialog: () => ({
    Dialog: () => null,
    openDialog: h.openDialog,
    data: undefined,
    closeDialog: vi.fn(),
  }),
}));

vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({
    getGlobalViewSchema: () => ({mode: h.mode}),
  }),
}));

vi.mock('@foundation/utils/navigation', () => ({
  getNavigationMode: () => 'self',
  openByMode: () => h.openByMode,
}));

// Partial mock: only the controller lookup is stubbed. `SidePanelContext` itself is kept so
// `ViewDialog` (the trigger's dialog surface) can still reset it for its content.
vi.mock('@admin/contexts/SidePanelContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@admin/contexts/SidePanelContext')>()),
  useSidePanelController: () => h.sidePanel,
}));

vi.mock('@admin/contexts/AdminConfigContext', () => ({
  useAdminConfig: () => ({navigationGuard: true}),
}));

// Reduce the button to a plain clickable element - the click handling is what we test.
vi.mock('@admin/components/buttons/ActionButton', () => ({
  ActionButton: ({onClick}: {onClick: (e: unknown) => void}) => (
    <button onClick={onClick}>action</button>
  ),
  ActionButtonWithChoices: ({
    onSelect,
  }: {
    onSelect: (e: unknown, choice: {label: string; value?: unknown}) => void;
  }) => <button onClick={(e) => onSelect(e, {label: 'choice'})}>action</button>,
}));

const clickButton = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button'));
};

beforeEach(() => {
  vi.clearAllMocks();
  h.presentation = 'page';
  h.mode = undefined;
  h.sidePanel = undefined;
  h.openByMode = false;
  h.routedOverlay = true;
});

describe('SchemaViewButton - opening the target view by mode', () => {
  it('inherits the target view mode: a dialog view opens a dialog on click', async () => {
    h.mode = 'dialog';
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" />);

    await clickButton();

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('navigates when the resolved mode is redirect and the view is routed', async () => {
    h.mode = undefined; // routed view, no explicit mode -> redirect
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" />);

    await clickButton();

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.openDialog).not.toHaveBeenCalled();
  });

  it('lets the action mode override the view mode (redirect view opened as dialog)', async () => {
    h.mode = 'redirect';
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="dialog" />);

    await clickButton();

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('warns and does nothing when redirect is forced onto a non-routed view', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    h.mode = 'dialog'; // view has no route
    // action forces redirect, but the target view cannot be redirected to
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.openDialog).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns and does nothing when an impossible redirect is forced from inside a dialog', async () => {
    // `view_mode: 'redirect'` on an action whose target view declares `mode: 'dialog'` is a
    // contradictory schema. It is reported and refused the same way on every surface - swapping the
    // view into the dialog instead would hide the contradiction on exactly one of them.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    h.presentation = 'dialog';
    h.mode = 'dialog'; // view has no route
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(h.changeView).not.toHaveBeenCalled();
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.openDialog).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns and does nothing when an impossible redirect is forced from the side panel', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    h.presentation = 'panel';
    h.sidePanel = {openView: vi.fn()};
    h.mode = 'sidepanel'; // view has no route
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(h.sidePanel.openView).not.toHaveBeenCalled();
    expect(h.openDialog).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('swaps a non-routed view in place when the action sets no mode', async () => {
    // Only the explicit, impossible `redirect` is refused. A default gesture inside a dialog still
    // shows a dialog/sidepanel view in place - no route is needed for that.
    h.presentation = 'dialog';
    h.mode = 'dialog';
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" />);

    await clickButton();

    expect(h.changeView).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('docks a sidepanel view into the panel when a controller is available', async () => {
    h.mode = 'sidepanel';
    h.sidePanel = {openView: vi.fn()};
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" recordPk={7} />);

    await clickButton();

    expect(h.sidePanel.openView).toHaveBeenCalledWith(
      expect.objectContaining({resource: 'svc/res', viewType: 'show', viewName: 'show', id: 7})
    );
    expect(h.openDialog).not.toHaveBeenCalled();
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('falls back to a dialog for a sidepanel view when no controller is available', async () => {
    h.mode = 'sidepanel';
    h.sidePanel = undefined; // e.g. a sidepanel trigger outside a list
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" />);

    await clickButton();

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
  });
});

// A view already shown in the side panel: its own toolbar triggers must escape the panel
// (navigate or open a dialog) instead of swapping the panel content, even though a controller
// is available and the view is technically in a dialog.
describe('SchemaViewButton - triggers escape the side panel from inside it', () => {
  beforeEach(() => {
    h.presentation = 'panel';
    h.sidePanel = {openView: vi.fn()};
  });

  it('navigates a redirect view instead of swapping the panel', async () => {
    h.mode = undefined; // routed -> redirect
    render(<SchemaViewButton viewType="edit" viewName="edit" reference="svc/res" />);

    await clickButton();

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.changeView).not.toHaveBeenCalled();
    expect(h.sidePanel!.openView).not.toHaveBeenCalled();
    expect(h.openDialog).not.toHaveBeenCalled();
    // and the panel it left closes: it belongs to the list this navigation is leaving behind, and
    // React keeps that list mounted when only the route params change.
    expect(h.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('opens a dialog view as a real dialog instead of swapping the panel', async () => {
    h.mode = 'dialog';
    render(<SchemaViewButton viewType="edit" viewName="edit" reference="svc/res" />);

    await clickButton();

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.changeView).not.toHaveBeenCalled();
    expect(h.sidePanel!.openView).not.toHaveBeenCalled();
  });

  it('falls back to a dialog for a sidepanel view rather than re-docking the same panel', async () => {
    h.mode = 'sidepanel';
    render(<SchemaViewButton viewType="edit" viewName="edit" reference="svc/res" />);

    await clickButton();

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.sidePanel!.openView).not.toHaveBeenCalled();
    expect(h.changeView).not.toHaveBeenCalled();
  });
});

// HAB-964: inside an overlay every gesture used to stay in it - an action that explicitly asked
// for `redirect` was swapped into the dialog like any other, so a record opened there could never
// be reached on its own page. An explicit redirect now leaves the overlay and navigates.
describe('SchemaViewButton - an explicit redirect escapes the overlay', () => {
  it('navigates out of a dialog instead of swapping the view in place', async () => {
    h.presentation = 'dialog';
    h.mode = undefined; // routed target view
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.changeView).not.toHaveBeenCalled();
  });

  it('closes the dialog it navigated out of', async () => {
    h.presentation = 'dialog';
    h.mode = undefined;
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    // Nothing else closes it: the dialog is owned above this trigger and React keeps that owner
    // mounted when only the route params change, so it would hang over the target page.
    expect(h.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open when the redirect went to a new tab', async () => {
    h.presentation = 'dialog';
    h.mode = undefined;
    h.openByMode = true; // ctrl/cmd-click - this tab stays where it is
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.closeOverlay).not.toHaveBeenCalled();
    // and the dialog is not silently swapped underneath the newly opened tab either
    expect(h.changeView).not.toHaveBeenCalled();
  });

  it('navigates out of the side panel and closes it', async () => {
    h.presentation = 'panel';
    h.sidePanel = {openView: vi.fn()};
    h.mode = undefined;
    render(
      <SchemaViewButton viewType="edit" viewName="edit" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('still swaps in the dialog when the action sets no mode', async () => {
    h.presentation = 'dialog';
    h.mode = undefined; // routed view, default gesture -> unchanged in-dialog swap
    render(<SchemaViewButton viewType="show" viewName="show" reference="svc/res" />);

    await clickButton();

    expect(h.changeView).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.closeOverlay).not.toHaveBeenCalled();
  });
});

// A `ViewDialog` mounted outside the schema's own view routing (a consumer composing one by hand)
// still presents its content as a dialog, but supplies no view router - and therefore no overlay to
// close. The trigger must not fall back to `prevView` there: on a page surface that is a navigation
// of its own, which would land the user somewhere else entirely.
describe('SchemaViewButton - an overlay with no view router of its own', () => {
  it('navigates once and closes nothing', async () => {
    h.presentation = 'dialog';
    h.routedOverlay = false;
    h.mode = undefined;
    render(
      <SchemaViewButton viewType="show" viewName="show" reference="svc/res" mode="redirect" />
    );

    await clickButton();

    expect(h.navigate).toHaveBeenCalledTimes(1);
    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.prevView).not.toHaveBeenCalled();
  });
});
