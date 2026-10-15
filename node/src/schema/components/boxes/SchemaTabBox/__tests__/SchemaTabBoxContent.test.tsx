import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {IsLastPanelContextProvider} from '@design/contexts/IsLastPanelContext';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {ActionDescriptor, BoxSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaTabBoxContent} from '../SchemaTabBoxContent';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const stableGetBoxName = (name: string) => name;

vi.mock('@foundation/hooks/useTabsLocation', () => ({
  useTabBox: () => ({
    activeTab: undefined,
    setTab: vi.fn(),
  }),
}));

vi.mock('@schema/contexts/ParentBoxContext', () => ({
  useParentBoxContext: () => ({
    getBoxName: stableGetBoxName,
    isHidden: false,
    parentBoxName: undefined,
    parentBoxSchema: undefined,
  }),
  ParentBoxProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

// Read-only keeps the tab titles off the form-status path, which needs a form context.
vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: true}),
}));

vi.mock('@schema/components/boxes/SchemaBox', () => ({
  SchemaBoxBody: ({schema, isRoot}: {schema: {name: string}; isRoot?: boolean}) => (
    <div data-testid={`box-${schema.name}`} data-root={String(Boolean(isRoot))} />
  ),
}));

vi.mock('@schema/components/buttons/SchemaButtons', () => ({
  SchemaButtons: () => <div data-testid={'toolbar-actions'} />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const saveAction = {name: 'save', action: {type: 'save'}} as ActionDescriptor;

// The tab-strip header holding the tabs — the toolbar sits here until a card header takes it over.
const tabStrip = (container: HTMLElement) => container.querySelector('.NavigationHeader');

const makeSchema = (over: Partial<BoxSchema> = {}): BoxSchema => ({
  name: 'detail',
  type: 'tab',
  readOnly: false,
  boxes: [
    {name: 'address', label: 'Address', type: 'simple', readOnly: false, boxes: []},
    {name: 'photos', label: 'Photos', type: 'simple', readOnly: false, boxes: []},
  ],
  ...over,
});

const renderTabs = (schema: BoxSchema, label?: false) =>
  render(<SchemaTabBoxContent schema={schema} isRoot label={label} />, {
    wrapper: ({children}: {children: React.ReactNode}) => (
      <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
    ),
  });

// ─── Tests ───────────────────────────────────────────────────────────────────

// The tab box evaluates `card` like the grid box minus the toolbar: a label or `collapsible` turn
// the surface on, an explicit value wins both ways, toolbar actions do not (they sit in the tab
// strip), and the root-box default is handed to the step whenever no card is drawn.
describe('SchemaTabBoxContent card and label', () => {
  it('renders card-less and hands the root default to the step by default', () => {
    const {container} = renderTabs(makeSchema());

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(screen.getByTestId('box-address').getAttribute('data-root')).toBe('true');
  });

  it('draws the card with its label in the header, and the step is no longer a root', () => {
    const {container} = renderTabs(makeSchema({label: 'Property'}));

    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByTestId('box-address').getAttribute('data-root')).toBe('false');
  });

  it('renders as before when the card is turned off, label included', () => {
    const {container} = renderTabs(makeSchema({label: 'Property', card: false}));

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(screen.queryByText('Property')).not.toBeInTheDocument();
    expect(screen.getByTestId('box-address').getAttribute('data-root')).toBe('true');
  });

  it('keeps toolbar actions in the tab strip without drawing a card for them', () => {
    const {container} = renderTabs(makeSchema({toolbarActions: [saveAction]}));

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(tabStrip(container)?.contains(screen.getByTestId('toolbar-actions'))).toBe(true);
  });

  it('moves the toolbar into the card header once the box has a label', () => {
    const {container} = renderTabs(makeSchema({label: 'Property', toolbarActions: [saveAction]}));

    const toolbar = screen.getByTestId('toolbar-actions');
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    expect(tabStrip(container)?.contains(toolbar)).toBe(false);
    expect(toolbar).toBeInTheDocument();
  });

  // A tab box nested in another tab renders with `label={false}` — its label is already the outer
  // tab's title — so it draws no card either and the default keeps travelling to the inner step.
  it('ignores the schema label when the parent passes none, and hands the default on', () => {
    const {container} = renderTabs(makeSchema({label: 'Property'}), false);

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(screen.queryByText('Property')).not.toBeInTheDocument();
    expect(screen.getByTestId('box-address').getAttribute('data-root')).toBe('true');
  });

  it('keeps the tab titles, which come from the child boxes', () => {
    renderTabs(makeSchema());

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
  });
});

// The active tab's box grows to the tab box's height on the last path, like a lone `PanelGrid`
// cell does in a simple box — so a form in a tab is as tall as the panel beside it.
describe('SchemaTabBoxContent panel height', () => {
  const renderWithLast = (isLast: boolean) =>
    render(
      <IsLastPanelContextProvider value={isLast}>
        <SchemaTabBoxContent schema={makeSchema()} isRoot />
      </IsLastPanelContextProvider>,
      {
        wrapper: ({children}: {children: React.ReactNode}) => (
          <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
        ),
      }
    );

  it('stretches the active tab box when the tab box is last on its path', () => {
    renderWithLast(true);

    expect(screen.getByTestId('box-address')).toHaveStyle({flexGrow: '1'});
  });

  it('keeps the active tab box at its natural height otherwise', () => {
    renderWithLast(false);

    expect(screen.getByTestId('box-address')).not.toHaveStyle({flexGrow: '1'});
  });
});
