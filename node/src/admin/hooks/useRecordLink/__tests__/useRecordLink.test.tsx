import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRecordLink} from '../useRecordLink';

// Shared, mutable test state referenced from the (hoisted) module mocks.
const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  openDialog: vi.fn(),
  changeView: vi.fn(() => true),
  openSidePanel: vi.fn(() => true),
  closeOverlay: vi.fn(),
  getLink: vi.fn(() => '/svc/res/1/show'),
  presentation: 'page' as ViewPresentation,
  newTab: false,
}));

vi.mock('react-admin', async (orig) => {
  const actual = await orig<typeof import('react-admin')>();
  return {...actual, useRecordContext: () => ({id: 1}), useResourceContext: () => 'svc/res'};
});

vi.mock('react-router', async (orig) => {
  const actual = await orig<typeof import('react-router')>();
  return {...actual, useNavigate: () => h.navigate};
});

vi.mock('@admin/hooks/useGetLinkWithData', () => ({useGetLinkWithData: () => h.getLink}));

vi.mock('@admin/contexts/ViewPresentationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@admin/contexts/ViewPresentationContext')>()),
  useViewPresentation: () => ({presentation: h.presentation}),
}));

vi.mock('@design/hooks/useDialog', () => ({
  useDialog: () => ({
    open: false,
    openDialog: h.openDialog,
    data: undefined,
    closeDialog: vi.fn(),
  }),
}));

vi.mock('@foundation/utils/navigation', () => ({
  getNavigationMode: () => 'self',
  openByMode: () => h.newTab,
}));

// Same chip, wired without the in-place navigation a dialog surface needs.
const ChipWithoutChangeView = ({linkMode}: {linkMode?: ViewPresentation}) => {
  const {handleClick} = useRecordLink({
    viewType: 'show',
    linkMode,
    openSidePanel: h.openSidePanel,
    closeOverlay: h.closeOverlay,
    renderContent: () => null,
  });
  return <button onClick={handleClick}>chip</button>;
};

// The chip reduced to the click it carries - the surface decision is what these tests are about.
// `closeOverlay` is supplied the way the schema layer supplies it: only where there is an overlay to
// close (see `useSchemaRecordLinkOptions`), so a page surface is handed none.
const Chip = ({linkMode}: {linkMode?: ViewPresentation}) => {
  const {handleClick} = useRecordLink({
    viewType: 'show',
    linkMode,
    changeView: h.changeView,
    openSidePanel: h.openSidePanel,
    closeOverlay: h.presentation === 'page' ? undefined : h.closeOverlay,
    renderContent: () => null,
  });
  return <button onClick={handleClick}>chip</button>;
};

const clickChip = async (linkMode?: ViewPresentation) => {
  render(<Chip linkMode={linkMode} />);
  await userEvent.setup().click(screen.getByRole('button'));
};

beforeEach(() => {
  vi.clearAllMocks();
  h.presentation = 'page';
  h.newTab = false;
});

// A record link resolves onto the same surfaces as a view action does (see
// `SchemaViewActionTrigger`): `linkMode` names the surface the target is opened on, and the
// container the link fires from decides how that surface is reached.
describe('useRecordLink - on a page', () => {
  it('navigates to the record when the link opens a page', async () => {
    await clickChip(undefined);

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.closeOverlay).not.toHaveBeenCalled(); // a page hands the hook nothing to close
  });

  it('opens a dialog when the link opens a dialog', async () => {
    await clickChip('dialog');

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('docks into the side panel when the link opens a panel', async () => {
    await clickChip('panel');

    expect(h.openSidePanel).toHaveBeenCalledWith(
      expect.objectContaining({resource: 'svc/res', viewType: 'show', id: 1})
    );
    expect(h.openDialog).not.toHaveBeenCalled();
  });

  it('falls back to a dialog when there is no panel to dock into', async () => {
    h.openSidePanel.mockReturnValueOnce(false);

    await clickChip('panel');

    expect(h.openDialog).toHaveBeenCalledTimes(1);
  });
});

describe('useRecordLink - from inside a dialog', () => {
  beforeEach(() => {
    h.presentation = 'dialog';
  });

  it('navigates out of the dialog and closes it when the link opens a page', async () => {
    // The whole point of a page link is the record's own page; staying in the dialog - or, as
    // before, doing nothing at all - never gets the user there.
    await clickChip(undefined);

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open when the redirect went to a new tab', async () => {
    h.newTab = true;

    await clickChip(undefined);

    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.closeOverlay).not.toHaveBeenCalled();
  });

  it('swaps the view inside the dialog when the link opens a dialog', async () => {
    await clickChip('dialog');

    expect(h.changeView).toHaveBeenCalledTimes(1);
    expect(h.openDialog).not.toHaveBeenCalled();
  });
});

describe('useRecordLink - from inside the side panel', () => {
  beforeEach(() => {
    h.presentation = 'panel';
  });

  it('navigates out of the panel and closes it when the link opens a page', async () => {
    await clickChip(undefined);

    expect(h.navigate).toHaveBeenCalledWith('/svc/res/1/show');
    expect(h.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('replaces the panel content when the link opens a panel', async () => {
    // The panel is the surface the user is looking at, so the target lands there rather than in a
    // dialog stacked on top of it.
    await clickChip('panel');

    expect(h.openSidePanel).toHaveBeenCalledTimes(1);
    expect(h.openDialog).not.toHaveBeenCalled();
  });

  it('opens a dialog on top of the panel when the link opens a dialog', async () => {
    await clickChip('dialog');

    expect(h.openDialog).toHaveBeenCalledTimes(1);
    expect(h.changeView).not.toHaveBeenCalled();
  });
});

describe('useRecordLink - a dialog surface with no in-place navigation', () => {
  it('warns instead of silently doing nothing', async () => {
    // `changeView` is what swaps the view into the dialog already on screen. Without it the click has
    // nothing to do - and answering with a redirect instead would open a surface the link did not ask
    // for, so the wiring mistake is reported.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    h.presentation = 'dialog';
    render(<ChipWithoutChangeView linkMode="dialog" />);

    await userEvent.setup().click(screen.getByRole('button'));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.openDialog).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
