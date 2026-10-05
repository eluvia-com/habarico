import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {EditToolbarActions} from '../EditToolbarActions';

const h = vi.hoisted(() => ({
  setActions: vi.fn(),
  toolbarActions: undefined as unknown,
  resolvedCount: 0,
  slotArgs: [] as unknown[],
}));

vi.mock('@admin/contexts/ViewPresentationContext', () => ({
  useViewPresentation: () => ({setActions: h.setActions, presentation: 'dialog'}),
}));
vi.mock('@admin/contexts/ResourceContext', () => ({useResourceContext: () => 'shop/order'}));
vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({
    viewSchema: {name: 'edit', detail: {toolbarActions: h.toolbarActions}},
  }),
}));
vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({hasShowView: true}),
}));
vi.mock('@schema/hooks/useResolvedDescriptors', () => ({
  useResolvedDescriptors: (...args: unknown[]) => {
    h.slotArgs = args;
    return {resolvedDescriptors: Array.from({length: h.resolvedCount})};
  },
}));
vi.mock('@schema/components/buttons/SchemaShowButton', () => ({SchemaShowButton: () => null}));

describe('EditToolbarActions', () => {
  beforeEach(() => {
    h.setActions.mockClear();
    h.toolbarActions = undefined;
    h.resolvedCount = 0;
  });

  it('resolves the toolbar slot the view renders, for its own view', () => {
    h.toolbarActions = [{type: 'default_actions'}];
    render(<EditToolbarActions />);
    expect(h.slotArgs).toEqual([{descriptors: [{type: 'default_actions'}], viewName: 'edit'}]);
  });

  it('adds its cancel action when the toolbar renders no button', () => {
    render(<EditToolbarActions />);
    expect(h.setActions).toHaveBeenCalled();
  });

  it('stays out of the way when the toolbar renders a button', () => {
    h.resolvedCount = 1;
    render(<EditToolbarActions />);
    expect(h.setActions).not.toHaveBeenCalled();
  });
});
