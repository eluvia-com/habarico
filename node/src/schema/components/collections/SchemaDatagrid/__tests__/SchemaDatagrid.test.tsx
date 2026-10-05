import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {render} from '@testing-library/react';
import {SchemaDatagrid} from '../SchemaDatagrid';

// Capture the props handed to the underlying Datagrid so the slot wiring can be asserted, and
// expose mutable collaborators (defaultRowAction, side panel, link/post-action spies, view schema).
const h = vi.hoisted(() => ({
  datagridProps: undefined as any,
  defaultRowAction: 'click' as 'click' | 'double-click' | 'none',
  rowTooltip: undefined as boolean | undefined,
  trigger: vi.fn(),
  openView: vi.fn(),
  hasSidePanel: true,
  presentation: 'page' as ViewPresentation,
  getGlobalViewSchema: vi.fn((_name: string) => ({type: 'show', mode: undefined}) as any),
  resourceActions: [] as {
    name: string;
    showInList: boolean;
    showInDetail: boolean;
    isDetail: boolean;
  }[],
}));

vi.mock('@admin/components/datagrid/AdminDatagrid', () => ({
  AdminDatagrid: (props: any) => {
    h.datagridProps = props;
    return null;
  },
}));
vi.mock('@schema/contexts/SchemaRootContext/useSchemaRootContext', () => ({
  useSchemaRootContext: () => ({defaultRowAction: h.defaultRowAction, rowTooltip: h.rowTooltip}),
}));
vi.mock('@admin/contexts/ListConfigContext', () => ({
  useListConfigContext: () => ({preferenceKey: 'p'}),
}));
vi.mock('@schema/contexts/MethodSchemaContext/useMethodSchemaContext', () => ({
  useMethodSchemaContext: () => ({fields: []}),
}));
vi.mock('@schema/contexts/ResourceFieldContext/useGetField', () => ({
  useGetField: () => () => null,
}));
vi.mock('@admin/contexts/SidePanelContext', () => ({
  useSidePanelController: () =>
    h.hasSidePanel ? {active: undefined, openView: h.openView, close: vi.fn()} : undefined,
}));
vi.mock('@admin/contexts/ViewPresentationContext', () => ({
  useViewPresentation: () => ({presentation: h.presentation}),
}));
vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({
    schema: {actions: h.resourceActions},
    getGlobalViewSchema: h.getGlobalViewSchema,
  }),
}));
vi.mock('@schema/hooks/useGetLocalResourceSchemas', () => ({
  useGetLocalResourceSchemas: () => () => ({isLoading: false, isError: false}),
}));
vi.mock('@schema/hooks/useTriggerAction', () => ({
  useTriggerAction: () => ({triggerActionElement: null, triggerAction: h.trigger}),
}));
vi.mock('react-admin', async (orig) => {
  const actual = await orig<typeof import('react-admin')>();
  return {
    ...actual,
    useNotify: () => vi.fn(),
    useDataProvider: () => ({}),
    useListContext: () => ({
      resource: 'svc/res',
      data: [],
      filterValues: {},
      sort: {field: 'id', order: 'ASC'},
      isLoading: false,
      isPending: false,
      refetch: vi.fn(),
      setSort: vi.fn(),
    }),
  };
});

// A resource action schema of type "view"; `view` overrides let a test set the presentation mode.
const action = (name: string, view: Record<string, unknown> = {}) => ({
  name,
  type: 'view',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  view: {name, endpoint: {service: 'svc', resource: 'res', actionName: name}, ...view},
});
const recordWith = (...actions: ReturnType<typeof action>[]) => ({
  id: 1,
  meta: {schema: {actions}},
});

const renderGrid = (props: any = {}) => {
  render(<SchemaDatagrid rowActionButtons={false} {...props} />);
};

beforeEach(() => {
  h.datagridProps = undefined;
  h.resourceActions = [];
  h.defaultRowAction = 'click';
  h.rowTooltip = undefined;
  h.hasSidePanel = true;
  h.presentation = 'page';
  h.getGlobalViewSchema.mockReturnValue({type: 'show', mode: undefined});
  vi.clearAllMocks();
});

describe('SchemaDatagrid - click slot wiring', () => {
  it('maps the FE default gesture (defaultRowAction "click") to the single slot only', () => {
    renderGrid();
    expect(h.datagridProps.onRowSingleClick).toBeInstanceOf(Function);
    expect(h.datagridProps.onRowDoubleClick).toBeUndefined();
  });

  it('maps the FE default gesture (defaultRowAction "double-click") to the double slot only', () => {
    h.defaultRowAction = 'double-click';
    renderGrid();
    expect(h.datagridProps.onRowSingleClick).toBeUndefined();
    expect(h.datagridProps.onRowDoubleClick).toBeInstanceOf(Function);
  });

  it('activates no slot when defaultRowAction is "none" and the backend configured nothing', () => {
    h.defaultRowAction = 'none';
    renderGrid();
    expect(h.datagridProps.onRowSingleClick).toBeUndefined();
    expect(h.datagridProps.onRowDoubleClick).toBeUndefined();
  });

  it('activates the single slot from a backend single_click_action regardless of defaultRowAction', () => {
    h.defaultRowAction = 'none';
    renderGrid({singleClickAction: {name: 'preview'}});
    expect(h.datagridProps.onRowSingleClick).toBeInstanceOf(Function);
    expect(h.datagridProps.onRowDoubleClick).toBeUndefined();
  });

  it('activates the double slot from a backend double_click_action regardless of defaultRowAction', () => {
    h.defaultRowAction = 'none';
    renderGrid({doubleClickAction: {name: 'edit'}});
    expect(h.datagridProps.onRowDoubleClick).toBeInstanceOf(Function);
  });
});

describe('SchemaDatagrid - row tooltip', () => {
  it('builds the row tooltip when the root context does not set rowTooltip', () => {
    renderGrid();
    expect(h.datagridProps.rowTooltip).toBeInstanceOf(Function);
  });

  it('builds the row tooltip when rowTooltip is true', () => {
    h.rowTooltip = true;
    renderGrid();
    expect(h.datagridProps.rowTooltip).toBeInstanceOf(Function);
  });

  it('omits the row tooltip but keeps the single-click activation when rowTooltip is false', () => {
    h.rowTooltip = false;
    renderGrid();
    expect(h.datagridProps.rowTooltip).toBeUndefined();
    expect(h.datagridProps.onRowSingleClick).toBeInstanceOf(Function);
  });

  it('omits the row tooltip but keeps the double-click activation when rowTooltip is false', () => {
    h.rowTooltip = false;
    h.defaultRowAction = 'double-click';
    renderGrid();
    expect(h.datagridProps.rowTooltip).toBeUndefined();
    expect(h.datagridProps.onRowDoubleClick).toBeInstanceOf(Function);
  });
});

describe('SchemaDatagrid - row activation delegates to the post-action', () => {
  const modeOf = () => h.trigger.mock.calls[0][0].schema.view.mode;

  it('resolves the default show action and delegates it without a mode of its own', () => {
    renderGrid();
    h.datagridProps.onRowSingleClick(recordWith(action('show'), action('edit')), 'same');

    expect(h.trigger).toHaveBeenCalledTimes(1);
    expect(h.trigger.mock.calls[0][0].schema.name).toBe('show');
    // The gesture carries no intent of its own, so the mode stays unset and the post-action
    // resolves it against the container it actually fires in (HAB-964: materialising it here made
    // a plain row click indistinguishable from an explicit `view_mode: 'redirect'`).
    expect(modeOf()).toBeUndefined();
  });

  it('injects the resolved dialog mode', () => {
    renderGrid({singleClickAction: {name: 'preview'}});
    h.datagridProps.onRowSingleClick(recordWith(action('preview', {mode: 'dialog'})), 'same');

    expect(modeOf()).toBe('dialog');
  });

  it('injects the resolved sidepanel mode (dispatch is left to the post-action)', () => {
    renderGrid({singleClickAction: {name: 'preview'}});
    h.datagridProps.onRowSingleClick(recordWith(action('preview', {mode: 'sidepanel'})), 'same');

    expect(modeOf()).toBe('sidepanel');
  });

  it("leaves the target view's own mode to the post-action when the action sets none", () => {
    h.getGlobalViewSchema.mockReturnValue({type: 'show', mode: 'dialog'});
    renderGrid({singleClickAction: {name: 'preview'}});
    h.datagridProps.onRowSingleClick(recordWith(action('preview')), 'same');

    expect(modeOf()).toBeUndefined();
  });

  it('keeps injecting the overlay fallback for an explicit sidepanel action', () => {
    // A nested datagrid (list inside a dialog/panel) must not dock into the surrounding panel.
    h.presentation = 'dialog';
    renderGrid({singleClickAction: {name: 'preview'}});
    h.datagridProps.onRowSingleClick(recordWith(action('preview', {mode: 'sidepanel'})), 'same');

    expect(modeOf()).toBe('dialog');
  });

  it('forwards the navigation mode to the post-action', () => {
    renderGrid();
    h.datagridProps.onRowSingleClick(recordWith(action('show')), 'tab');

    expect(h.trigger.mock.calls[0][0].navMode).toBe('tab');
  });

  it('delegates a non-view action by type without injecting a mode', () => {
    const resourceAction = {
      name: 'run',
      type: 'resource',
      isDetail: true,
      showInList: true,
      showInDetail: true,
    };
    renderGrid({singleClickAction: {name: 'run'}});
    h.datagridProps.onRowSingleClick(recordWith(resourceAction as never), 'same');

    expect(h.trigger).toHaveBeenCalledTimes(1);
    expect(h.trigger.mock.calls[0][0].schema.type).toBe('resource');
  });

  it('does nothing when the configured action cannot be resolved (no show fallback)', () => {
    // `show` exists but a configured-yet-unresolvable descriptor must not fall back to it.
    renderGrid({singleClickAction: {name: 'missing'}});
    h.datagridProps.onRowSingleClick(recordWith(action('show')), 'same');

    expect(h.trigger).not.toHaveBeenCalled();
  });
});

describe('SchemaDatagrid - row action column', () => {
  const columnOf = (props: any) => {
    render(<SchemaDatagrid {...props} />);
    return h.datagridProps.rowActionButtons;
  };
  const recordAction = {name: 'approve', showInList: true, showInDetail: true, isDetail: true};

  it('has no column for an absent or empty slot — row actions are never inferred', () => {
    h.resourceActions = [recordAction];
    expect(columnOf({})).toBe(false);
    expect(columnOf({rowActions: []})).toBe(false);
  });

  it('shows the column when the slot names an action the resource has', () => {
    expect(columnOf({rowActions: [{name: 'approve'}]})).toBe(false);
    h.resourceActions = [recordAction];
    expect(columnOf({rowActions: [{name: 'approve'}]})).toBeTruthy();
  });

  it("shows it for the resource's own defaults only when one of its record actions qualifies", () => {
    const slot = [{type: 'default_actions', scope: 'detail'}];
    expect(columnOf({rowActions: slot})).toBe(false);
    h.resourceActions = [recordAction];
    expect(columnOf({rowActions: slot})).toBeTruthy();
  });

  it('shows custom buttons as given and drops the column on false', () => {
    expect(columnOf({rowActionButtons: <span />})).toBeTruthy();
    expect(columnOf({rowActions: [{name: 'approve'}], rowActionButtons: false})).toBe(false);
  });
});
