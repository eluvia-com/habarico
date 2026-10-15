import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {defaultButtonProvider} from '@schema/providers/defaultButtonProvider';
import {ResourceActionSchema, ViewActionParameters, ViewType} from '@schema/types';
import {render} from '@testing-library/react';
import {SchemaButton} from '../SchemaButton';

// Shared, mutable test state referenced from the (hoisted) module mocks.
const h = vi.hoisted(() => ({viewType: 'edit' as ViewType}));

vi.mock('react-admin', async (orig) => {
  const actual = await orig<typeof import('react-admin')>();
  return {
    ...actual,
    useRecordContext: () => ({id: 1}),
    useSourceContext: () => ({getSource: (source: string) => source}),
    useTranslate: () => (key: string) => key,
  };
});

vi.mock('@admin/contexts/ResourceContext', () => ({
  useResourceContext: (resource?: string) => resource ?? 'svc/res',
}));

vi.mock('@schema/hooks/useGlobalResourceSchemaContext', () => ({
  useGlobalResourceSchemaContext: () => ({
    getGlobalViewSchema: (name?: string) => ({type: h.viewType, name: name ?? 'edit'}),
  }),
}));

// The real provider is what maps an action schema onto its concrete button - keep it, so the test
// covers the whole chain (schema -> SchemaButton props -> concrete button -> rendered glyph).
vi.mock('@schema/contexts/ResourceButtonContext/useGetButton', () => ({
  useGetButton: () => defaultButtonProvider,
}));

vi.mock('@schema/hooks/useCallAction', () => ({
  useCallAction: () => ({isLoading: false, isRunning: false, callAction: vi.fn()}),
}));

vi.mock('@schema/hooks/useTriggerAction', () => ({
  useTriggerAction: () => ({triggerActionElement: null, triggerAction: vi.fn()}),
}));

// MUI tags every icon with a `data-testid` (e.g. `EditRoundedIcon`) - the rendered glyph name.
const renderedIcon = (schema: ResourceActionSchema, viewType: ViewType = 'edit') => {
  h.viewType = viewType;
  const {container} = render(<SchemaButton schema={schema} />);
  return container.querySelector('svg')?.getAttribute('data-testid');
};

const action = (extra: Partial<ResourceActionSchema>): ResourceActionSchema => ({
  name: 'action',
  type: 'view',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  ...extra,
});

// The backend omits `choices` unless the action defines them, while the type declares them
// required - so the fixture casts instead of passing an empty array, which would flip
// SchemaViewButton onto its split-button path.
const viewAction = (icon?: string): ResourceActionSchema =>
  action({name: 'edit', icon, view: {name: 'edit'} as ViewActionParameters});

describe('SchemaButton icon resolution', () => {
  it('uses the icon from the schema when the backend sends one', () => {
    expect(renderedIcon(viewAction('Add'))).toBe('AddRoundedIcon');
  });

  it('falls back to the target view type default for an icon-less edit action', () => {
    expect(renderedIcon(viewAction(), 'edit')).toBe('EditRoundedIcon');
  });

  it('falls back to the target view type default for an icon-less show action', () => {
    expect(renderedIcon(viewAction(), 'show')).toBe('VisibilityRoundedIcon');
  });

  it('lets a link button keep its own default icon', () => {
    const schema = action({
      name: 'docs',
      type: 'link',
      isDetail: false,
      link: {url: 'https://example.com'},
    });
    expect(renderedIcon(schema)).toBe('LinkRoundedIcon');
  });

  it('keeps the generic action icon for an icon-less resource action', () => {
    const schema = action({
      name: 'publish',
      type: 'resource',
      resource: {endpoint: {method: 'post', path: '/publish'}, data: {}},
    });
    expect(renderedIcon(schema)).toBe('TaskRoundedIcon');
  });
});
