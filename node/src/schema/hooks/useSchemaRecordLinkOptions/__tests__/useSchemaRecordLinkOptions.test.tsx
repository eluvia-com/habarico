import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {ViewModeType} from '@schema/types';
import {renderHook} from '@testing-library/react';
import {useSchemaRecordLinkOptions} from '../useSchemaRecordLinkOptions';

const h = vi.hoisted(() => ({
  presentation: 'page' as ViewPresentation,
  hasSidePanel: false,
  viewMode: undefined as ViewModeType | undefined,
}));

vi.mock('react-admin', async (orig) => {
  const actual = await orig<typeof import('react-admin')>();
  return {...actual, useResourceContext: () => 'svc/res'};
});

vi.mock('@admin/contexts/SidePanelContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@admin/contexts/SidePanelContext')>()),
  useSidePanelController: () => (h.hasSidePanel ? {openView: vi.fn(), close: vi.fn()} : undefined),
}));

vi.mock('@admin/contexts/ViewPresentationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@admin/contexts/ViewPresentationContext')>()),
  useViewPresentation: () => ({presentation: h.presentation}),
}));

vi.mock('@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext', () => ({
  useSchemaViewRouterContext: () => ({changeView: vi.fn(), prevView: vi.fn()}),
}));

vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({
    hasShowView: true,
    hasEditView: true,
    getGlobalViewSchema: () => ({type: 'show', mode: h.viewMode}),
  }),
}));

const resolvedMode = (linkMode?: ViewPresentation) =>
  renderHook(() => useSchemaRecordLinkOptions({link: true, linkMode})).result.current.linkMode;

beforeEach(() => {
  vi.clearAllMocks();
  h.presentation = 'page';
  h.hasSidePanel = false;
  h.viewMode = undefined;
});

// The surface a record link opens on goes through the same resolution as a view action does, so a
// chip and an action pointing at the same record behave alike. These pin the wiring; the rule
// itself is covered in `utils/__tests__/viewMode.test.ts`.
describe('useSchemaRecordLinkOptions - the requested surface is resolved, not taken as is', () => {
  it('keeps a page link on a page', () => {
    expect(resolvedMode(undefined)).toBe('page');
  });

  it('falls back to a dialog for a panel link with no panel to dock into', () => {
    expect(resolvedMode('panel')).toBe('dialog');
  });

  it('keeps a panel link docking when a panel is available', () => {
    h.hasSidePanel = true;
    expect(resolvedMode('panel')).toBe('panel');
  });

  it("inherits the target view's own mode when the field asks for nothing", () => {
    // A view declared as a dialog has no route, so a page link to it could never resolve.
    h.viewMode = 'dialog';
    expect(resolvedMode(undefined)).toBe('dialog');
  });

  it('does not open a nested panel from inside an overlay', () => {
    h.presentation = 'dialog';
    h.viewMode = 'sidepanel';
    expect(resolvedMode(undefined)).toBe('dialog');
  });

  it('leaves an explicit dialog link a dialog inside an overlay', () => {
    h.presentation = 'panel';
    expect(resolvedMode('dialog')).toBe('dialog');
  });
});
