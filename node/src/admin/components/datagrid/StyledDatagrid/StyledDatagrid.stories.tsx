import React, {ReactNode, useState} from 'react';
import {
  CoreAdminContext,
  ListContextProvider,
  RaRecord,
  ResourceContextProvider,
  SelectColumnsButton,
  TestMemoryRouter,
  memoryStore,
  useList,
} from 'react-admin';
import {BooleanField} from '@admin/components/fields/BooleanField';
import {NumberField} from '@admin/components/fields/NumberField';
import {TextField} from '@admin/components/fields/TextField';
import {ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {IconType} from '@design/atoms/Icon';
import {ResponsiveScrollbar} from '@design/atoms/Scrollbar';
import {Panel} from '@design/molecules/Panel';
import {PanelContent} from '@design/molecules/PanelContent';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {Box} from '@mui/material';
import type {Decorator, Meta, StoryObj} from '@storybook/react-vite';
import {i18nProvider} from '../../../pages/_i18n';
import {StyledDatagrid, StyledDatagridProps} from './StyledDatagrid';

// ----------------------------------------------------------------------------
// Sample data — the same "owners" flavour the AdminDatagrid story and the admin
// page harness use.
// ----------------------------------------------------------------------------

type Owner = RaRecord & {
  id: number;
  clientNumber: string;
  clientType: string;
  name: string;
  properties: number;
  share: string;
  complete: boolean;
};

const OWNERS: Owner[] = [
  {
    id: 1,
    clientNumber: '100712',
    clientType: 'Individual',
    name: 'Mgr. Ing. Petr Kašák',
    properties: 3,
    share: '1 / 1',
    complete: true,
  },
  {
    id: 2,
    clientNumber: '100713',
    clientType: 'Individual',
    name: 'Jana Nováková',
    properties: 1,
    share: '1 / 2',
    complete: true,
  },
  {
    id: 3,
    clientNumber: '100714',
    clientType: 'Company',
    name: 'Acme s.r.o.',
    properties: 8,
    share: '1 / 2',
    complete: false,
  },
  {
    id: 4,
    clientNumber: '100715',
    clientType: 'Individual',
    name: 'Ing. Karel Dvořák',
    properties: 2,
    share: '1 / 4',
    complete: true,
  },
  {
    id: 5,
    clientNumber: '100716',
    clientType: 'Company',
    name: 'Wenceslas Holding a.s.',
    properties: 21,
    share: '1 / 1',
    complete: false,
  },
];

// Default column set — plain React Admin fields, skinned by `StyledDatagrid`. Passed as an *array*
// (not a fragment): React Admin's header maps over `children` and only flattens arrays, so a fragment
// would collapse every column into a single blank header cell.
const columns: ReactNode = [
  <TextField key="clientNumber" source="clientNumber" label="Client no." />,
  <TextField key="name" source="name" />,
  <TextField key="clientType" source="clientType" label="Type" />,
  <NumberField key="properties" source="properties" />,
  <TextField key="share" source="share" label="Co-ownership share" />,
  <BooleanField key="complete" source="complete" />,
];

const PREFERENCE_KEY = 'styledDatagrid.demo';
const DEFAULT_SORT = {field: 'id', order: 'ASC'} as const;

// ----------------------------------------------------------------------------
// Story-support harness. Boots the minimal live React Admin context the datagrid
// needs — `CoreAdminContext` (store + query client + i18n, *not* `AdminContext`,
// so RA doesn't inject its own theme over the design theme from the global
// decorator), a router and a `ResourceContext` — then feeds it a client-side
// `ListContext` built from static rows via `useList`. The grid is framed in a
// `Panel` (and `ResponsiveScrollbar`, since the Panel clips its rounded corners)
// like a real list screen.
// ----------------------------------------------------------------------------

const dataProvider = {
  getList: () => Promise.resolve({data: OWNERS, total: OWNERS.length}),
  getOne: (_resource: string, {id}: {id: number}) =>
    Promise.resolve({data: OWNERS.find((o) => o.id === id) ?? OWNERS[0]}),
  getMany: () => Promise.resolve({data: OWNERS}),
} as never;

const withGridShell: Decorator = (Story) => {
  const [store] = useState(() => memoryStore());
  return (
    <TestMemoryRouter>
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider} store={store}>
        <ResourceContextProvider value="owners">
          {/*
           * `p` (padding), not `m` (margin): a margin on this Box collapses through `body` (no
           * border/padding of its own separates them), so it isn't counted in the height Storybook's
           * Docs preview frame auto-sizes to — the bottom gap silently disappears and the panel sits
           * flush against the frame edge while the top/side gaps (unaffected by collapsing) still show.
           * Padding can't collapse, so it renders identically but sizes correctly.
           */}
          <Box sx={{maxWidth: 900, p: 2, overflow: 'auto'}}>
            <Story />
          </Box>
        </ResourceContextProvider>
      </CoreAdminContext>
    </TestMemoryRouter>
  );
};

// Hooks (useList) live in this top-level demo component, not inside `render` — Storybook's
// `jsxDecorator` re-invokes `render` outside the providers to serialize "Show code".
const StyledDatagridDemo = ({configurable}: Pick<StyledDatagridProps, 'configurable'>) => {
  const listContext = useList<Owner>({data: OWNERS, sort: DEFAULT_SORT});
  return (
    <ListContextProvider value={listContext}>
      <ListConfigProvider
        preferenceKey={PREFERENCE_KEY}
        sort={DEFAULT_SORT}
        filterDefaultValues={{}}
        filters={[]}
      >
        <Panel>
          <PanelHeader
            label="Owners"
            icon={IconType.Group}
            // `configurable` on its own only wires up the column-preference store — the
            // show/hide picker is a separate button a consumer places in their own toolbar
            // (React Admin's `SelectColumnsButton`, reading the same `preferenceKey`).
            actions={
              configurable ? <SelectColumnsButton preferenceKey={PREFERENCE_KEY} /> : undefined
            }
          />
          <PanelContent paddingSize="none">
            <ResponsiveScrollbar>
              <StyledDatagrid
                bulkActionButtons={false}
                configurable={configurable}
                preferenceKey={PREFERENCE_KEY}
              >
                {columns}
              </StyledDatagrid>
            </ResponsiveScrollbar>
          </PanelContent>
        </Panel>
      </ListConfigProvider>
    </ListContextProvider>
  );
};

const meta = {
  title: 'admin/datagrid/StyledDatagrid',
  component: StyledDatagrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The presentational core of the admin datagrid — React Admin's `<Datagrid>` restyled into " +
          'the design system: the neutral header band, the design-system sort caret, the hover / ' +
          'selected row tint plus a 4px accent stripe, per-row semantic tinting and the sticky ' +
          'actions column, all via `datagridSx`. It reads the ambient `ListContext` for its rows and ' +
          'is pure pass-through — every RA `Datagrid` prop works, including a custom `body` — adding ' +
          'only the skin, the sort caret and a `configurable` toggle. `AdminDatagrid` builds on it ' +
          'with the resource-aware wiring (column preferences, row-click navigation, drag-and-drop, ' +
          'resizable columns); the schema array box reuses it with its own `body`.',
      },
    },
    controls: {include: ['configurable']},
  },
  argTypes: {
    configurable: {control: 'boolean'},
  },
  args: {
    configurable: false,
  },
  decorators: [withGridShell],
} satisfies Meta<StyledDatagridProps>;

export default meta;

type Story = StoryObj<StyledDatagridProps>;

/**
 * Interactive instance — the restyled datagrid rendering static rows through the ambient
 * `ListContext`. Toggle `configurable` to swap in React Admin's column-configurable variant and
 * reveal a "Columns" button (React Admin's `SelectColumnsButton`, reading the same
 * `preferenceKey`) that shows/hides/reorders columns — a consumer places that button in their own
 * toolbar the same way.
 */
// `render` returns the local `StyledDatagridDemo` wrapper (it owns the `useList`/context wiring
// the live grid needs), so "Show code" would otherwise print that wrapper's tag.
// `docs.source.transform` rebuilds the real, composed usage from the story's current args instead.
const buildPlaygroundSource = ({configurable}: Pick<StyledDatagridProps, 'configurable'>) => `${
  configurable ? '<SelectColumnsButton preferenceKey="owners.list" />\n' : ''
}<StyledDatagrid bulkActionButtons={false} configurable={${String(!!configurable)}} preferenceKey="owners.list">
  <TextField source="clientNumber" label="Client no." />
  <TextField source="name" />
  <TextField source="clientType" label="Type" />
  <NumberField source="properties" />
  <TextField source="share" label="Co-ownership share" />
  <BooleanField source="complete" />
</StyledDatagrid>`;

export const Playground: Story = {
  render: ({configurable}) => <StyledDatagridDemo configurable={configurable} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: Pick<StyledDatagridProps, 'configurable'>}) =>
          buildPlaygroundSource(args),
      },
    },
  },
};
