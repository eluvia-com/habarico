import React, {ReactNode, useEffect, useState} from 'react';
import {
  CoreAdminContext,
  Identifier,
  ListContextProvider,
  Pagination,
  RaRecord,
  ResourceContextProvider,
  TestMemoryRouter,
  memoryStore,
  useList,
  useListContext,
} from 'react-admin';
import {action} from 'storybook/actions';
import {DatagridActions} from '@admin/components/datagrid/DatagridActions';
import {DatagridRowTooltip} from '@admin/components/datagrid/DatagridRowTooltip';
import {BooleanField} from '@admin/components/fields/BooleanField';
import {NumberField} from '@admin/components/fields/NumberField';
import {TextField} from '@admin/components/fields/TextField';
import {AdminSettingsStyles} from '@admin/components/settings';
import {ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {IconType} from '@design/atoms/Icon';
import {ResponsiveScrollbar} from '@design/atoms/Scrollbar';
import {ButtonDefinition, ButtonsStack} from '@design/molecules/ButtonsStack';
import {Panel} from '@design/molecules/Panel';
import {PanelContent} from '@design/molecules/PanelContent';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {NavMode} from '@foundation/utils/navigation';
import {Box, FormControlLabel, Stack, Switch, ToggleButton, ToggleButtonGroup} from '@mui/material';
import type {Decorator, Meta, StoryObj} from '@storybook/react-vite';
import {i18nProvider} from '../../../pages/_i18n';
import {AdminDatagrid, AdminDatagridProps} from './AdminDatagrid';

// ----------------------------------------------------------------------------
// Sample data — an "owners" list, the same property-management flavour the
// admin page harness uses.
// ----------------------------------------------------------------------------

type Owner = RaRecord & {
  id: number;
  clientNumber: string;
  clientType: string;
  name: string;
  properties: number;
  share: string;
  complete: boolean;
  active: boolean;
};

const BASE_OWNERS: Owner[] = [
  {
    id: 1,
    clientNumber: '100712',
    clientType: 'Individual',
    name: 'Mgr. Ing. Petr Kašák',
    properties: 3,
    share: '1 / 1',
    complete: true,
    active: true,
  },
  {
    id: 2,
    clientNumber: '100713',
    clientType: 'Individual',
    name: 'Jana Nováková',
    properties: 1,
    share: '1 / 2',
    complete: true,
    active: true,
  },
  {
    id: 3,
    clientNumber: '100714',
    clientType: 'Company',
    name: 'Acme s.r.o.',
    properties: 8,
    share: '1 / 2',
    complete: false,
    active: false,
  },
  {
    id: 4,
    clientNumber: '100715',
    clientType: 'Individual',
    name: 'Ing. Karel Dvořák',
    properties: 2,
    share: '1 / 4',
    complete: true,
    active: true,
  },
  {
    id: 5,
    clientNumber: '100716',
    clientType: 'Company',
    name: 'Wenceslas Holding a.s.',
    properties: 21,
    share: '1 / 1',
    complete: false,
    active: true,
  },
];

// Padded past a single page so the pagination control has something to page through.
const OWNERS: Owner[] = [
  ...BASE_OWNERS,
  ...Array.from({length: 8}, (_, i): Owner => {
    const id = BASE_OWNERS.length + i + 1;
    return {
      id,
      clientNumber: String(100800 + i),
      clientType: i % 2 ? 'Company' : 'Individual',
      name: `Test Owner ${id}`,
      properties: ((i * 4 + 2) % 15) + 1,
      share: i % 3 ? '1 / 2' : '1 / 1',
      complete: i % 2 === 0,
      active: i % 5 !== 0,
    };
  }),
];

// ----------------------------------------------------------------------------
// Story-support harness. Boots the minimal live React Admin context an
// AdminDatagrid needs — `CoreAdminContext` (store + query client + i18n),
// a router (row-click navigation calls `useNavigate`) and a `ResourceContext`
// — then feeds it a client-side `ListContext` built from static rows via
// `useList`. `CoreAdminContext`, not `SchemaRootContext`, so React Admin doesn't
// inject its own theme over the design theme from the global decorator.
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

// Default column set — plain React Admin fields, skinned by the design theme. Passed as an *array*
// (not a fragment): React Admin's header maps over `children` and only flattens arrays, so a fragment
// would collapse every column into a single blank header cell.
const columns: ReactNode = [
  <TextField key="clientNumber" source="clientNumber" label="Client no." />,
  <TextField key="name" source="name" />,
  <TextField key="clientType" source="clientType" label="Type" />,
  <NumberField key="properties" source="properties" />,
  <TextField key="share" source="share" label="Co-ownership share" />,
  <BooleanField key="complete" source="complete" />,
  <BooleanField key="active" source="active" />,
];

// Mirrors `columns` above — used to compose the "Show code" snippets, since `render` returns the
// local `DemoGrid` helper rather than a real `<AdminDatagrid>` usage.
const COLUMNS_SOURCE = `  <TextField source="clientNumber" label="Client no." />
  <TextField source="name" />
  <TextField source="clientType" label="Type" />
  <NumberField source="properties" />
  <TextField source="share" label="Co-ownership share" />
  <BooleanField source="complete" />
  <BooleanField source="active" />`;

/** Two per-row actions (view stats / edit) rendered into the pinned right column via `ButtonsStack`. */
const ROW_ACTIONS: ButtonDefinition[] = [
  {label: 'Statistics', icon: IconType.BarChart, onClick: action('statistics')},
  {label: 'Edit', icon: IconType.Edit, onClick: action('edit')},
];

const rowActions = <ButtonsStack surface="iconButton" buttons={ROW_ACTIONS} size={'small'} />;

// Rows carrying a `color-*` class in `meta.tags` (read by `DatagridRow`) — one per semantic color,
// plus a trailing untinted row — to exercise per-row tinting and show that the hover/selected
// highlight is suppressed on tinted rows but still fires on the plain one.
const TINT_TAGS = ['color-success', 'color-error', 'color-warning', 'color-info', 'color-primary'];
const TINTED_OWNERS: Owner[] = [
  ...BASE_OWNERS.map((owner, i) => ({...owner, meta: {tags: [TINT_TAGS[i]]}})),
  {
    ...BASE_OWNERS[0],
    id: 99,
    clientNumber: '100799',
    name: 'Plain row — hover still highlights',
    meta: undefined,
  },
];

// Rows pre-selected on mount by `PreselectRows`, so the (stronger) selected-row highlight is visible
// without the viewer having to interact.
const PRESELECTED_IDS: Identifier[] = [1, 3];

/**
 * Selects the given rows via the ambient `ListContext` on mount. React Admin's datagrid marks a row
 * `selected` when its id is in `selectedIds` regardless of `bulkActionButtons`, so this drives the
 * selected-row highlight with no checkbox column.
 */
const PreselectRows = ({ids}: {ids: Identifier[]}) => {
  const {onSelect} = useListContext();
  useEffect(() => {
    onSelect(ids);
  }, [onSelect, ids]);
  return null;
};

/** Live count of the selected rows, read from the ambient `ListContext` — shows selection working. */
const SelectionCount = () => {
  const {selectedIds} = useListContext();
  return (
    <Box sx={{alignSelf: 'center', mr: 1, color: 'text.secondary', typography: 'body2'}}>
      {selectedIds.length} selected
    </Box>
  );
};

// A shared preference-store key so the datagrid's persisted state (column widths, column
// selection) and the toolbar buttons that reset/toggle it all point at the same entry.
const PREFERENCE_KEY = 'owners.datagrid';
const DEFAULT_SORT = {field: 'id', order: 'ASC'} as const;

/**
 * Wires a client-side `ListContext` from static rows around an `AdminDatagrid` and frames it like a
 * real list screen — a `Panel` whose `PanelHeader` carries the real datagrid toolbar
 * (`DatagridActions`, reading the same `ListConfigContext` the buttons act on) and whose body holds
 * the grid plus a `Pagination` bar. Any `AdminDatagrid` prop passes straight through; `data` overrides
 * the rows (e.g. the empty state). The toolbar's column selector is enabled by `configurableColumns`.
 */
const DemoGrid = ({
  data = OWNERS,
  children = columns,
  preselect,
  perPage = 5,
  infinite,
  extraActions,
  selectOnRowClick,
  ...props
}: Partial<AdminDatagridProps<Owner>> & {
  data?: Owner[];
  preselect?: Identifier[];
  perPage?: number;
  /**
   * Render the whole list in one scrollable container instead of paginating — every row on a single
   * page (`perPage` = row count) and no pagination bar. The `ResponsiveScrollbar` caps the height, so
   * a long list scrolls. Used by the drag-and-drop story so every row is reorderable at once.
   */
  infinite?: boolean;
  extraActions?: ReactNode;
  /**
   * Wire single-click row selection through the `onRowSingleClick` slot (the datagrid always
   * suppresses RA's native `rowClick`). `'single'` replaces the selection (`onSelect([id])`) so
   * clicking another row deselects the previous — the natural behaviour when there is no checkbox
   * column; `'toggle'` accumulates (`onToggleItem(id)`) like the checkboxes. A consumer
   * `onRowSingleClick` (e.g. logging) still runs afterwards.
   */
  selectOnRowClick?: 'single' | 'toggle';
}) => {
  const listContext = useList<Owner>({
    data,
    perPage: infinite ? Math.max(data.length, 1) : perPage,
    sort: DEFAULT_SORT,
  });
  const {configurableColumns} = props;

  const handleRowSingleClick = selectOnRowClick
    ? (record: Owner, mode: NavMode) => {
        if (selectOnRowClick === 'single') listContext.onSelect([record.id]);
        else listContext.onToggleItem(record.id);
        props.onRowSingleClick?.(record, mode);
      }
    : props.onRowSingleClick;
  return (
    <ListContextProvider value={listContext}>
      {preselect && <PreselectRows ids={preselect} />}
      {/*
       * `DatagridActions` reads its config (preferenceKey / sort / filters) from `ListConfigContext`,
       * so the same `preferenceKey` and `sort` that drive the datagrid also drive the toolbar's reset
       * buttons — they stay in sync. No filters here, so the toolbar is just the column selector (with
       * `configurableColumns`) plus the reset controls.
       */}
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
            actions={
              <>
                {extraActions}
                <DatagridActions columnSelector={configurableColumns} />
              </>
            }
          />
          <PanelContent paddingSize="none">
            {/*
             * The Panel surface is `overflow: hidden` (rounded corners), so a wide/tall datagrid must
             * scroll inside its own container — otherwise it is clipped. This mirrors the real list
             * screen, which wraps the datagrid in a `ResponsiveScrollbar` (SimpleBar: horizontal scroll
             * for resized columns + a viewport-derived max height). Pagination stays outside, fixed.
             */}
            <ResponsiveScrollbar>
              <AdminDatagrid<Owner>
                bulkActionButtons={false}
                preferenceKey={PREFERENCE_KEY}
                {...props}
                onRowSingleClick={handleRowSingleClick}
              >
                {children}
              </AdminDatagrid>
            </ResponsiveScrollbar>
            {!infinite && <Pagination />}
          </PanelContent>
        </Panel>
      </ListConfigProvider>
    </ListContextProvider>
  );
};

const meta = {
  title: 'admin/datagrid/AdminDatagrid',
  component: AdminDatagrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The admin-layer datagrid — React Admin's `<Datagrid>` restyled into the design system " +
          'and extended for the admin list shell. It reads the ambient `ListContext` for rows and ' +
          'the `ResourceContext` for its preference-store key, and adds: a pinned, shadowed ' +
          '**row-actions** column (`rowActionButtons`); **resizable** columns (`resizableColumns`, ' +
          'widths persisted per resource in the preference store); **configurable** columns ' +
          '(`configurableColumns`, a show/hide/reorder panel); drag-and-drop **row reordering** ' +
          '(`enableDnd` + `onDropRow`); a hover **row tooltip** (`rowTooltip`); and independent ' +
          'single- vs double-click **row activation** (`onRowSingleClick` / `onRowDoubleClick`). ' +
          'The schema wrapper `SchemaDatagrid` builds on it. Deliberately distinct from the ' +
          'presentational `design/organisms/DataGrid` — hence the `Admin` prefix.',
      },
      // `render` returns the local `DemoGrid` helper (it wires the `ListContext` / `Panel` /
      // `Pagination` shell around the grid) — "Show code" would otherwise show that helper's tag,
      // so this overrides it with the real usage: `AdminDatagrid` with its column children. Only
      // `Playground` shows code at all (every Showcase story below sets `canvas.sourceState:
      // 'none'`); it reads live args, so `transform` (not a static `code`) keeps the snippet in
      // sync with the current Controls values.
      source: {
        transform: (
          _code: string,
          {
            args,
          }: {
            args: {
              resizableColumns: boolean;
              configurableColumns: boolean;
              minColumnWidth: number;
            };
          }
        ) =>
          `<AdminDatagrid
  preferenceKey="owners.datagrid"
  resizableColumns={${args.resizableColumns}}
  configurableColumns={${args.configurableColumns}}
  minColumnWidth={${args.minColumnWidth}}
>
${COLUMNS_SOURCE}
</AdminDatagrid>`,
      },
    },
    controls: {include: ['resizableColumns', 'configurableColumns', 'minColumnWidth']},
  },
  argTypes: {
    resizableColumns: {control: 'boolean'},
    configurableColumns: {control: 'boolean'},
    minColumnWidth: {control: {type: 'number', min: 20, max: 200, step: 10}},
  },
  args: {
    resizableColumns: false,
    configurableColumns: false,
    minColumnWidth: 20,
  },
  decorators: [withGridShell],
} satisfies Meta<AdminDatagridProps<Owner>>;

export default meta;

type Story = StoryObj<AdminDatagridProps<Owner>>;

/**
 * Interactive instance — toggle the column flags from the Controls panel. `resizableColumns` adds
 * drag handles between headers (widths are remembered in the store); `configurableColumns` swaps in
 * the show/hide/reorder header.
 */
export const Playground: Story = {
  // `render` takes an (unused) parameter on purpose: Storybook infers `__isArgsStory` from the
  // function's arity (`render.length > 0`), and skips `controls.include` filtering entirely for a
  // zero-arity `render` — so a plain `() => ...` here would silently ignore the curated table.
  render: ({resizableColumns, configurableColumns, minColumnWidth}) => (
    <DemoGrid
      resizableColumns={resizableColumns}
      configurableColumns={configurableColumns}
      minColumnWidth={minColumnWidth}
    />
  ),
};

/**
 * Resizable columns — drag the thin handle on the right edge of any header to resize. The chosen
 * widths are written to the preference store under the resource's key, so they survive re-renders.
 */
export const ResizableColumns: Story = {
  // No Controls and no "Show code" — a Showcase story only demonstrates a fixed prop combination;
  // `Playground` above is the one story whose code is meant to be copy-pasted.
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  // `_args` keeps `render` non-zero-arity, matching the story standard even though this story
  // never reads args.
  render: (_args) => <DemoGrid resizableColumns />,
};

/**
 * Configurable columns — the column-selector button in the panel header (`SelectColumnsButton`)
 * opens a show / hide / reorder panel; the reset button next to it clears the customisation. The
 * selection is persisted per `preferenceKey`.
 */
export const ConfigurableColumns: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DemoGrid configurableColumns />,
};

/**
 * With per-row actions — `rowActionButtons` renders the same node into a right-pinned column that
 * stays put while the grid scrolls sideways and casts a soft shadow over the cells beneath it.
 */
export const RowWithActions: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DemoGrid rowActionButtons={rowActions} />,
};

/**
 * Drag-and-drop reordering — with `enableDnd` and an `onDropRow` handler each row grows a drag
 * handle in a leading column; dropping a row calls back with the record and its new index. Rendered
 * as an **infinite list** (`infinite` — every row on one scrollable page, no pagination) so the whole
 * list can be reordered at once rather than a page at a time.
 */
const RowDragAndDropDemo = () => {
  const [rows, setRows] = useState(OWNERS);
  const handleDrop = (record: RaRecord, index: number) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== record.id);
      next.splice(index, 0, record as Owner);
      return next;
    });
  };
  return <DemoGrid data={rows} enableDnd onDropRow={handleDrop} infinite />;
};

export const RowDragAndDrop: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <RowDragAndDropDemo />,
};

/**
 * Row activation — `onRowSingleClick` and `onRowDoubleClick` are independent slots. With both set,
 * the single-click fires only once it's clear no double-click follows (returning a string would
 * navigate). Each gesture is also logged to the Storybook **Actions** panel with its record and
 * navigation mode.
 *
 * With no checkbox column, single-click here drives **single-selection** (`selectOnRowClick="single"`
 * → `onSelect([id])`): clicking a row selects it and **deselects the previously selected one** — only
 * one row is ever highlighted, the natural default without checkboxes (contrast `RowSelection`, whose
 * checkbox column accumulates a multi-selection). Double-click still just logs (an "open" gesture).
 */
export const RowTooltipsAndClick: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <DemoGrid
      rowTooltip={() => <DatagridRowTooltip singleLabel="Select" doubleLabel="Open" />}
      selectOnRowClick="single"
      onRowSingleClick={action('onRowSingleClick')}
      onRowDoubleClick={action('onRowDoubleClick')}
    />
  ),
};

/**
 * Per-row semantic tinting — a record's `meta.tags` carrying a `color-*` class softly tints that row
 * (via the theme's `MuiTableRow`, at the same 8% strength as `design/organisms/DataGrid`). The sticky
 * actions column keeps its own surface, and the hover/selected highlight is deliberately suppressed
 * on tinted rows so it can't fight the color — the trailing untinted row still highlights on hover.
 */
export const RowTinting: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DemoGrid data={TINTED_OWNERS} perPage={10} rowActionButtons={rowActions} />,
};

// ----------------------------------------------------------------------------
// Density & striping — the two body-class settings the real app applies to the
// datagrid. `useAdminSettings` mirrors them onto `document.body` (`density-*`,
// `hab-striped`) and `AdminSettingsStyles` — rendered here for real — scopes the
// datagrid CSS to them. The toolbar toggles the same classes, so you exercise the
// actual CSS path with zero grid re-renders.
// ----------------------------------------------------------------------------

const DENSITIES = ['compact', 'standard', 'comfortable'] as const;
type DensityValue = (typeof DENSITIES)[number];

const DensityDemo = () => {
  const [density, setDensity] = useState<DensityValue>('standard');
  const [striped, setStriped] = useState(false);

  // Mirrors useAdminSettings' body-class contract (compact = no class).
  useEffect(() => {
    const {classList} = document.body;
    classList.remove('density-standard', 'density-comfortable');
    if (density !== 'compact') classList.add(`density-${density}`);
    classList.toggle('hab-striped', striped);
    return () => classList.remove('density-standard', 'density-comfortable', 'hab-striped');
  }, [density, striped]);

  return (
    <>
      <AdminSettingsStyles />
      <Stack direction="row" spacing={2} sx={{mb: 2, alignItems: 'center'}}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={density}
          onChange={(_, v: DensityValue | null) => v && setDensity(v)}
        >
          {DENSITIES.map((d) => (
            <ToggleButton key={d} value={d}>
              {d}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <FormControlLabel
          control={<Switch checked={striped} onChange={(_, v) => setStriped(v)} />}
          label="Striped rows"
        />
      </Stack>
      <DemoGrid
        perPage={10}
        rowActionButtons={rowActions}
        bulkActionButtons={<></>}
        bulkActionsToolbar={<></>}
      />
    </>
  );
};

/**
 * Row selection — like `design/organisms/DataGrid`, the admin datagrid supports selecting rows once
 * the checkbox column is active. It's React Admin's built-in bulk selection: passing a truthy
 * `bulkActionButtons` adds the leading checkbox column (a **select-all** box in the header, a per-row
 * box in each row), and selected rows get the same green highlight + left stripe as the hover/selected
 * state (our `DatagridRow` tags a selected `<tr>` with `Mui-selected`). Select **one or many** rows by
 * ticking individual boxes, the header box to toggle the whole page, or — enabled here — by
 * **single-clicking anywhere on a row**. Because the datagrid always suppresses React Admin's native
 * `rowClick`, click-to-select is wired through the `onRowSingleClick` slot calling the list context's
 * `onToggleItem` (clicking the checkbox toggles once — RA stops that click from also reaching the
 * row). The live count in the toolbar reflects the current selection (rows 1 and 3 start selected);
 * RA's floating bulk-action toolbar is suppressed (`bulkActionsToolbar={<></>}`) to keep the focus on
 * selection.
 */
export const RowSelection: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <DemoGrid
      preselect={PRESELECTED_IDS}
      extraActions={<SelectionCount />}
      bulkActionButtons={<></>}
      bulkActionsToolbar={<></>}
      selectOnRowClick="toggle"
    />
  ),
};

/**
 * Density & striped rows — the two global body-class settings for the admin datagrid (persisted per
 * user as `preferences.layout.app.density` / `.stripedRows`). `AdminSettingsStyles` is rendered for
 * real; the toolbar flips the same body classes `useAdminSettings` sets, so you can compare compact /
 * standard / comfortable padding and the zebra striping — including the solid stripe on the pinned
 * actions column.
 */
export const DensityAndStriping: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DensityDemo />,
};

/** Empty state — no rows; React Admin renders its standard empty placeholder. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <DemoGrid data={[]} />,
};
