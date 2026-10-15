import React from 'react';
import {Box, Chip, Typography} from '@mui/material';
import type {GridColDef} from '@mui/x-data-grid';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import type {ColorType} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../../molecules/ButtonsStack';
import {Panel} from '../../molecules/Panel';
import {PanelContent} from '../../molecules/PanelContent';
import {PanelHeader} from '../../molecules/PanelHeader';
import {DataGrid} from './DataGrid';
import {DataGridProvider} from './DataGridProvider';
import {DataGridToolbar} from './DataGridToolbar';
import {rowColorClass} from './tinting';

/* -- sample "owners" data -- */

type Owner = {
  id: number;
  clientNumber: string;
  clientType: string;
  name: string;
  complete: boolean;
  lead: boolean;
  inSjm: boolean;
  share: string;
  status?: ColorType;
  coOwner?: string;
};

const OWNERS: Owner[] = [
  {
    id: 1,
    clientNumber: '100712',
    clientType: 'Individual',
    name: 'Mgr. Ing. Petr Kašák',
    complete: true,
    lead: true,
    inSjm: false,
    share: '1 / 1',
  },
  {
    id: 2,
    clientNumber: '100713',
    clientType: 'Individual',
    name: 'Jana Nováková',
    coOwner: 'Ing. Pavel Novák',
    complete: true,
    lead: false,
    inSjm: true,
    share: '1 / 2',
  },
  {
    id: 3,
    clientNumber: '100714',
    clientType: 'Company',
    name: 'Acme s.r.o.',
    complete: false,
    lead: false,
    inSjm: false,
    share: '1 / 2',
  },
  {
    id: 4,
    clientNumber: '100715',
    clientType: 'Individual',
    name: 'Ing. Karel Dvořák',
    complete: true,
    lead: false,
    inSjm: false,
    share: '1 / 4',
  },
];

const OWNER_COLUMNS: GridColDef<Owner>[] = [
  {field: 'clientNumber', headerName: 'Client no.', width: 110},
  {field: 'clientType', headerName: 'Type', width: 120},
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 180,
    // One owner has a co-owner shown on a second line — with `getRowHeight={() => 'auto'}` the row
    // grows and everything stays vertically centered (the padding comes from the cell, per density).
    renderCell: (params) => (
      <Box>
        <Typography variant={'body2'}>{params.row.name}</Typography>
        {params.row.coOwner && (
          <Typography variant={'body2'} sx={{color: 'text.secondary'}}>
            {params.row.coOwner}
          </Typography>
        )}
      </Box>
    ),
  },
  {
    field: 'complete',
    headerName: 'Complete',
    width: 120,
    sortable: false,
    renderCell: (params) => (
      <Chip
        size={'small'}
        variant={'soft'}
        color={params.row.complete ? 'success' : 'default'}
        label={params.row.complete ? 'Yes' : 'No'}
      />
    ),
  },
  {field: 'lead', headerName: 'Lead', width: 90, valueFormatter: (value) => (value ? 'Yes' : 'No')},
  {
    field: 'inSjm',
    headerName: 'In joint estate',
    width: 130,
    valueFormatter: (value) => (value ? 'Yes' : 'No'),
  },
  {field: 'share', headerName: 'Co-ownership share', width: 160},
];

const noop = () => {};

/** The two per-row actions from the mockup — a stats view and an edit button. */
const OWNER_ACTIONS: ButtonDefinition[] = [
  {label: 'Statistics', icon: IconType.BarChart, onClick: noop},
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
];

const OwnerActions = () => (
  <ButtonsStack surface={'iconButton'} buttons={OWNER_ACTIONS} size="small" />
);

const meta: Meta<typeof DataGrid> = {
  title: 'design/organisms/DataGrid',
  component: DataGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A thin, presentational restyle of **MUI X DataGrid (Community)** for full relations ' +
          '(linked clients, contracts, documents) that have their own edit forms — as opposed to ' +
          'the simpler `DataTable` for nested objects edited in bulk. It owns pagination, sorting, ' +
          'columns and per-row actions in a right-pinned column, and it can stand alone as a view. ' +
          'Pure pass-through: every MUI X prop works; it only adds `rowActions`, the redesign style ' +
          '(neutral header band, hover/selected tints, per-row `color-*` tinting) and sensible ' +
          'defaults (single-click selection, no column menu/filter, auto height). Backend filters ' +
          'are out of scope. Compose the separate **`DataGridToolbar`** (columns / fit / reset sort) ' +
          'by wrapping both in a **`DataGridProvider`** that shares the grid API.',
      },
    },
    controls: {include: ['density', 'stripedRows', 'checkboxSelection', 'disableRowHighlight']},
  },
  argTypes: {
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
    stripedRows: {control: 'boolean'},
    checkboxSelection: {control: 'boolean'},
    disableRowHighlight: {control: 'boolean'},
  },
  args: {
    density: 'standard',
    stripedRows: false,
    checkboxSelection: false,
    disableRowHighlight: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof DataGrid>;

/** Interactive instance — sorting, pagination and single-click row selection. */
export const Playground: Story = {
  // Only the (non-generic) control props are forwarded — spreading all `args` into `DataGrid<Owner>`
  // trips the generic row-type inference.
  render: ({density, stripedRows, checkboxSelection, disableRowHighlight}) => (
    <DataGrid<Owner>
      columns={OWNER_COLUMNS}
      rows={OWNERS}
      density={density}
      stripedRows={stripedRows}
      checkboxSelection={checkboxSelection}
      disableRowHighlight={disableRowHighlight}
      getRowHeight={() => 'auto'}
    />
  ),
};

/**
 * With per-row actions — the right-pinned actions column. Buttons sit at 30% opacity and go
 * full opacity on row hover/selection; the column stays pinned while the grid scrolls sideways.
 * No `actionsWidth` is passed here, so the column is measured to fit the rendered buttons, and a
 * flexible spacer keeps it flush against the grid's right edge.
 */
export const RowWithActions: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataGrid<Owner>
      columns={OWNER_COLUMNS}
      rows={OWNERS}
      rowActions={() => <OwnerActions />}
      getRowHeight={() => 'auto'}
    />
  ),
};

/**
 * Striped rows — a subtle `action.hover` zebra on every other row (including the pinned actions
 * cell). The primary hover/selected tint still wins on interaction, and semantic-tinted rows opt out.
 */
export const RowStriped: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataGrid<Owner>
      columns={OWNER_COLUMNS}
      rows={OWNERS}
      stripedRows
      rowActions={() => <OwnerActions />}
      getRowHeight={() => 'auto'}
    />
  ),
};

/** Selection — checkboxes plus a stronger tint on the selected rows. */
export const RowSelection: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataGrid<Owner>
      columns={OWNER_COLUMNS}
      rows={OWNERS}
      checkboxSelection
      getRowHeight={() => 'auto'}
    />
  ),
};

/**
 * Per-row semantic tinting — return a `color-*` class from `getRowClassName` (here from a row's
 * `status`) to tint the row, as in the "List správ" screen. The pinned actions column is excluded.
 * The hover/selected highlight is disabled (`disableRowHighlight`) so it doesn't fight the row tints.
 */
export const RowTinting: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => {
    const rows: Owner[] = [
      {...OWNERS[0], status: 'success'},
      {...OWNERS[1], status: 'warning'},
      {...OWNERS[2], status: 'error'},
      {...OWNERS[3]},
    ];
    return (
      <DataGrid<Owner>
        columns={OWNER_COLUMNS}
        rows={rows}
        rowActions={() => <OwnerActions />}
        disableRowHighlight
        getRowClassName={(params) => (params.row.status ? rowColorClass(params.row.status) : '')}
        getRowHeight={() => 'auto'}
      />
    );
  },
};

/**
 * Inside a `Panel` with a composed toolbar — the toolbar lives in the `PanelHeader` actions slot
 * yet drives the grid via the shared `DataGridProvider` (the "Vlastníci" panel). `PanelContent`
 * is full-bleed so the grid meets the panel edges.
 */
export const InPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataGridProvider>
      <Panel sx={{maxWidth: 860}}>
        <PanelHeader label={'Owners'} icon={IconType.Group} actions={<DataGridToolbar />} />
        <PanelContent paddingSize={'none'}>
          <DataGrid<Owner>
            columns={OWNER_COLUMNS}
            rows={OWNERS}
            rowActions={() => <OwnerActions />}
            getRowHeight={() => 'auto'}
          />
        </PanelContent>
      </Panel>
    </DataGridProvider>
  ),
};

/** Empty state — a configurable `emptyMessage` centered on a `background.paper` surface. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataGrid<Owner> columns={OWNER_COLUMNS} rows={[]} emptyMessage={'No owners found'} />
  ),
};
