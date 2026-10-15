import React, {ReactElement, useEffect, useState} from 'react';
import {
  CoreAdminContext,
  InputProps,
  ListContextProvider,
  RaRecord,
  ResourceContextProvider,
  TestMemoryRouter,
  TopToolbar,
  memoryStore,
  useList,
  useListContext,
} from 'react-admin';
import {TextInput} from '@admin/components/inputs/TextInput';
import {ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {
  ViewPresentationProvider,
  type ViewPresentationState,
} from '@admin/contexts/ViewPresentationContext';
import {Box} from '@mui/material';
import type {Decorator, Meta, StoryObj} from '@storybook/react-vite';
import {i18nProvider} from '../../../pages/_i18n';
import {DatagridActions, DatagridActionsProps} from './DatagridActions';

// ----------------------------------------------------------------------------
// Sample data — a small "owners" list backing the client-side `ListContext` the
// toolbar reads (filter values, saved queries). No datagrid is rendered: these
// stories are just the toolbar, so the rows themselves are never displayed.
// ----------------------------------------------------------------------------

type Owner = RaRecord & {
  id: number;
  clientNumber: string;
  clientType: string;
  name: string;
  properties: number;
  active: boolean;
};

const OWNERS: Owner[] = [
  {id: 1, clientNumber: '100712', clientType: 'Individual', name: 'Mgr. Ing. Petr Kašák', properties: 3, active: true}, // prettier-ignore
  {
    id: 2,
    clientNumber: '100713',
    clientType: 'Individual',
    name: 'Jana Nováková',
    properties: 1,
    active: true,
  },
  {
    id: 3,
    clientNumber: '100714',
    clientType: 'Company',
    name: 'Acme s.r.o.',
    properties: 8,
    active: false,
  },
  {
    id: 4,
    clientNumber: '100715',
    clientType: 'Individual',
    name: 'Ing. Karel Dvořák',
    properties: 2,
    active: true,
  },
  {id: 5, clientNumber: '100716', clientType: 'Company', name: 'Wenceslas Holding a.s.', properties: 21, active: true}, // prettier-ignore
  {
    id: 6,
    clientNumber: '100717',
    clientType: 'Individual',
    name: 'Test Owner 6',
    properties: 4,
    active: false,
  },
  {
    id: 7,
    clientNumber: '100718',
    clientType: 'Company',
    name: 'Test Owner 7',
    properties: 7,
    active: true,
  },
];

// The list's filter inputs, so `DatagridActions` renders the filter button + saved-queries button.
// Passed to `ListConfigProvider` as the ambient list config. `search` is a free-text quick search
// (no matching `Owner` field — the fake `dataProvider` never reads either `source`, since this story
// only renders the toolbar, not a filtered list); `name` filters by the record's own `name` field.
// Both are `alwaysOn`: React Admin's `FilterForm` (what `FilterDrawerButton`'s panel renders) only
// ever shows `alwaysOn` filters plus whichever ones the user has toggled on — with none `alwaysOn`
// and no toggle affordance in this demo, the panel would open empty.
const FILTERS: ReactElement<InputProps>[] = [
  <TextInput key="search" source="search" label="Search" alwaysOn />,
  <TextInput key="name" source="name" label="Name" alwaysOn />,
];
const NO_FILTERS: ReactElement<InputProps>[] = [];
const FILTER_DEFAULTS = {};

const PREFERENCE_KEY = 'owners.datagrid';
const DEFAULT_SORT = {field: 'id', order: 'ASC'} as const;

// Applies a filter value on mount so buttons that only appear with an active filter show up — namely
// `SavedQueriesButton`, which renders `null` until there is a saved preset or a live filter value.
const ApplyFilter = ({filter}: {filter: Record<string, unknown>}) => {
  const {setFilters} = useListContext();
  useEffect(() => {
    setFilters(filter, {});
  }, [setFilters, filter]);
  return null;
};

// A sensible "active owners only" filter — keeps rows visible while giving the list a live filter value.
const ACTIVE_FILTER = {active: true};

// A dialog surface, so `DatagridActions` swaps the (page-only) filter drawer for the inline
// `FilterButton`. Only `presentation` is read here; the portal setters are safe no-ops for the story.
const DIALOG_PRESENTATION: ViewPresentationState = {
  presentation: 'dialog',
  setActions: () => undefined,
  setTitle: () => undefined,
  setSubtitle: () => undefined,
  setBottomActions: () => undefined,
};

// ----------------------------------------------------------------------------
// Story-support harness. Boots the minimal live React Admin context the toolbar
// needs — `CoreAdminContext` (store + query client + i18n), a router (some
// buttons navigate) and a `ResourceContext` — via a decorator; each story then
// supplies the `ListContext` (from static rows) and the `ListConfigContext` the
// toolbar reads. `CoreAdminContext`, not `SchemaRootContext`, so React Admin doesn't
// inject its own theme over the design theme.
// ----------------------------------------------------------------------------

const dataProvider = {
  getList: () => Promise.resolve({data: OWNERS, total: OWNERS.length}),
  getOne: (_resource: string, {id}: {id: number}) =>
    Promise.resolve({data: OWNERS.find((o) => o.id === id) ?? OWNERS[0]}),
  getMany: () => Promise.resolve({data: OWNERS}),
} as never;

const withActionsShell: Decorator = (Story) => {
  const [store] = useState(() => memoryStore());
  return (
    <TestMemoryRouter>
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider} store={store}>
        <ResourceContextProvider value="owners">
          <Box sx={{maxWidth: 900, m: 2, overflow: 'auto'}}>
            <Story />
          </Box>
        </ResourceContextProvider>
      </CoreAdminContext>
    </TestMemoryRouter>
  );
};

/**
 * Renders just the toolbar — `DatagridActions` in a React Admin `TopToolbar` (the container
 * `ListShell` uses), no datagrid. It wires the two contexts the toolbar reads: a client-side
 * `ListContext` (`useList`) for the filter / saved-query buttons, and a `ListConfigProvider` for the
 * `preferenceKey` / `sort` / `filters` the buttons act on. With `inDialog`, a `ViewPresentationProvider`
 * marks the surface as a dialog.
 */
const DemoActions = ({
  columnSelector = false,
  filters = NO_FILTERS,
  inDialog = false,
  initialFilter,
}: {
  columnSelector?: boolean;
  filters?: ReactElement<InputProps>[];
  inDialog?: boolean;
  initialFilter?: Record<string, unknown>;
}) => {
  const listContext = useList<Owner>({data: OWNERS, perPage: 5, sort: DEFAULT_SORT});
  const toolbar = (
    <ListContextProvider value={listContext}>
      {initialFilter && <ApplyFilter filter={initialFilter} />}
      <ListConfigProvider
        preferenceKey={PREFERENCE_KEY}
        sort={DEFAULT_SORT}
        filterDefaultValues={FILTER_DEFAULTS}
        filters={filters}
      >
        <TopToolbar sx={{justifyContent: 'flex-start'}}>
          <DatagridActions columnSelector={columnSelector} />
        </TopToolbar>
      </ListConfigProvider>
    </ListContextProvider>
  );
  return inDialog ? (
    <ViewPresentationProvider value={DIALOG_PRESENTATION}>{toolbar}</ViewPresentationProvider>
  ) : (
    toolbar
  );
};

const meta = {
  title: 'admin/datagrid/DatagridActions',
  component: DatagridActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The datagrid-config toolbar shown above an admin list — the `<List>` actions bar. **It ' +
          'takes no config props of its own: `preferenceKey`, `sort`, `filterDefaultValues` and ' +
          '`filters` all come from the ambient `ListConfigContext`** (provided by `ListConfigProvider`, ' +
          'e.g. via `ListShell`) — only `columnSelector` and `size` are real props. It renders, in ' +
          'order: the always-visible **reset column widths** button, — only when `ListConfig.filters` ' +
          'is non-empty — a **filter** control plus the **saved queries** button, and finally a ' +
          'trailing **`⋮` more menu** collecting the secondary config actions (the optional **column ' +
          'selector** plus **reset sort / configuration**, which read `ListConfig.sort` / ' +
          '`.filterDefaultValues` — content-driven, collapsed only when there is more than one). On a ' +
          'page the filter opens the design `InspectorPanel` via `FilterDrawerButton` (with a reset ' +
          'action in its footer); inside a dialog (`ViewPresentationContext`) it falls back to the ' +
          'inline `FilterButton`. `ListShell` mounts it as the default `listActions`, and ' +
          "`SchemaListActions` renders it alongside the schema-driven buttons. The Playground's " +
          '`hasFilters` control below simulates `ListConfig.filters` — see its description.',
      },
      // `render` returns the local `DemoActions` helper (it wires the `ListContext` /
      // `ListConfigProvider` the toolbar needs) — "Show code" would otherwise show that helper's
      // tag, so this overrides it with the real usage: `DatagridActions` inside the
      // `ListConfigProvider` it actually reads its config from. Only `Playground` shows code at all
      // (every Showcase story below sets `canvas.sourceState: 'none'`); it reads live args, so
      // `transform` (not a static `code`) keeps the snippet in sync with the current Controls values.
      source: {
        transform: (
          _code: string,
          {args}: {args: {columnSelector: boolean; hasFilters: boolean}}
        ) =>
          `<ListConfigProvider
  preferenceKey="owners.datagrid"
  sort={{field: 'id', order: 'ASC'}}
  filterDefaultValues={{}}
  filters={${args.hasFilters ? '[<TextInput source="search" alwaysOn />, <TextInput source="name" alwaysOn />]' : '[]'}}
>
  <TopToolbar>
    <DatagridActions columnSelector={${args.columnSelector}} />
  </TopToolbar>
</ListConfigProvider>`,
      },
    },
    controls: {include: ['columnSelector', 'hasFilters']},
  },
  argTypes: {
    columnSelector: {control: 'boolean'},
    // Not a real `DatagridActions` prop — the component takes no config of its own; it reads
    // `filters` off the ambient `ListConfigContext` (see the component description above). This
    // control simulates that: toggling it swaps what `ListConfigProvider` is given below, the way a
    // real list's filter inputs would.
    hasFilters: {
      control: 'boolean',
      description:
        'Not a `DatagridActions` prop — simulates the ambient `ListConfigContext.filters`. An ' +
        'empty list (the default) hides the filter and saved-queries buttons entirely.',
    },
  },
  args: {
    columnSelector: false,
    hasFilters: false,
  },
  decorators: [withActionsShell],
} satisfies Meta<DatagridActionsProps & {hasFilters?: boolean}>;

export default meta;

type Story = StoryObj<DatagridActionsProps & {hasFilters?: boolean}>;

/**
 * Interactive instance — toggle `columnSelector` from the Controls panel. `hasFilters` isn't a real
 * prop (`DatagridActions` takes its list config from the ambient `ListConfigContext`, not props) —
 * it simulates a list that does or doesn't declare filter inputs, which is what actually drives the
 * filter / saved-queries buttons on a real list. Without filters the toolbar is just reset column
 * widths plus the `⋮` more menu (reset sort / configuration, and the column selector when on), which
 * act on the datagrid's preference-store state (keyed by `preferenceKey`) once wired to a real grid.
 */
export const Playground: Story = {
  // `render` takes an (unused) parameter on purpose: Storybook infers `__isArgsStory` from the
  // function's arity (`render.length > 0`), and skips `controls.include` filtering entirely for a
  // zero-arity `render` — so a plain `() => ...` here would silently ignore the curated table.
  render: ({columnSelector, hasFilters}) => (
    <DemoActions columnSelector={columnSelector} filters={hasFilters ? FILTERS : NO_FILTERS} />
  ),
};

/**
 * With the column selector — `columnSelector` adds the show / hide / reorder columns button (bound to
 * the datagrid's `preferenceKey`). The schema list turns this on via `SchemaRootContext.columnSelector`.
 */
export const WithColumnSelector: Story = {
  // No Controls and no "Show code" — a Showcase story only demonstrates a fixed prop combination;
  // `Playground` above is the one story whose code is meant to be copy-pasted.
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  // `_args` keeps `render` non-zero-arity, matching the story standard even though this story
  // never reads args.
  render: (_args) => <DemoActions columnSelector />,
};

/**
 * With filters — when the ambient `ListConfig` carries filter inputs, the toolbar grows a filter
 * button; the page variant opens the design `InspectorPanel` (with a reset-configuration action in its
 * footer). The **saved queries** button joins only once the list has a live filter value or a saved
 * preset (`SavedQueriesButton` renders nothing before that) — see `FullToolbar`, which pre-applies a
 * filter.
 */
export const WithFilters: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DemoActions filters={FILTERS} />,
};

/**
 * The full toolbar — column selector on and filters present, with an "active owners" filter pre-applied
 * so every control shows: reset column widths, the filter drawer, the **saved queries** button (visible
 * because there is now a live filter value) and the trailing `⋮` more menu (column selector + reset sort
 * / configuration).
 */
export const FullToolbar: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DemoActions columnSelector filters={FILTERS} initialFilter={ACTIVE_FILTER} />,
};

/**
 * Inside a dialog — a `ViewPresentationProvider` marks the surface `presentation: 'dialog'`, so the
 * toolbar swaps the page-only filter drawer for the inline `FilterButton` (the drawer's `InspectorPanel`
 * doesn't belong over a dialog). A filter is pre-applied so the saved-queries button shows too; the
 * other buttons are unchanged.
 */
export const InDialog: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <DemoActions columnSelector filters={FILTERS} inDialog initialFilter={ACTIVE_FILTER} />
  ),
};
