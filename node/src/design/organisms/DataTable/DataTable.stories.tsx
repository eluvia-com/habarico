import React from 'react';
import {Box, Chip} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../../molecules/ButtonsStack';
import {Panel} from '../../molecules/Panel';
import {PanelContent} from '../../molecules/PanelContent';
import {PanelHeader} from '../../molecules/PanelHeader';
import {DataTable, type DataTableColumn} from './DataTable';

/* -- sample nested-object data -- */

type Parcel = {
  number: string;
  area: string;
  hasBuilding: boolean;
  inTrust: boolean;
};

const PARCELS: Parcel[] = [
  {number: '2145', area: '200 m²', hasBuilding: true, inTrust: true},
  {number: '2146', area: '308 m²', hasBuilding: true, inTrust: true},
  {number: '2147', area: '308 m²', hasBuilding: true, inTrust: false},
  {number: '2148', area: '198 m²', hasBuilding: false, inTrust: true},
  {number: '2149', area: '212 m²', hasBuilding: true, inTrust: true},
];

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

const noop = () => {};

/** Two per-row actions — an edit and a delete button, mirroring `DataGrid`'s actions column. */
const PARCEL_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
];

const ParcelActions = () => <ButtonsStack surface={'iconButton'} buttons={PARCEL_ACTIONS} />;

const PARCEL_COLUMNS: DataTableColumn<Parcel>[] = [
  {key: 'number', header: 'Number'},
  {key: 'area', header: 'Area'},
  {key: 'hasBuilding', header: 'Building on parcel', render: (row) => yesNo(row.hasBuilding)},
  {key: 'inTrust', header: 'In managed trust', render: (row) => yesNo(row.inTrust)},
];

type BuildingNumber = {value: string};

const BUILDING_NUMBERS: BuildingNumber[] = [
  {value: '218'},
  {value: '88'},
  {value: '320'},
  {value: '233'},
];

/* -- a wide dataset, to show horizontal scroll under a pinned actions column -- */

type Contract = {
  id: number;
  code: string;
  counterparty: string;
  address: string;
  signed: string;
  amount: string;
  note: string;
};

const CONTRACTS: Contract[] = [
  {
    id: 1,
    code: 'CTR-2024-000112',
    counterparty: 'Mgr. Ing. Petr Kašák',
    address: 'Dvořákova 419, Bezděkovské Předměstí, 344 01 Domažlice',
    signed: '2024-03-18',
    amount: '1 250 000 Kč',
    note: 'Renewed annually; indexed to CPI, notice period three months before term.',
  },
  {
    id: 2,
    code: 'CTR-2024-000119',
    counterparty: 'Jana Nováková',
    address: 'U Vršků 837, Prague – Bory, 301 00 Plzeň',
    signed: '2024-05-02',
    amount: '84 500 Kč',
    note: 'One-off; paid on completion.',
  },
  {
    id: 3,
    code: 'CTR-2024-000133',
    counterparty: 'Acme Property Holdings s.r.o.',
    address: 'Náměstí Republiky 1078/1, Nové Město, 110 00 Praha 1',
    signed: '2024-06-27',
    amount: '3 900 000 Kč',
    note: 'Framework agreement covering multiple units; see appendix B for the per-unit schedule.',
  },
];

const CONTRACT_COLUMNS: DataTableColumn<Contract>[] = [
  {key: 'code', header: 'Contract no.'},
  {key: 'counterparty', header: 'Counterparty'},
  {key: 'address', header: 'Address'},
  {key: 'signed', header: 'Signed'},
  {key: 'amount', header: 'Amount', align: 'right'},
  // Opt this column back into wrapping — long prose reads better on multiple lines than as one
  // very wide, scroll-only cell.
  {key: 'note', header: 'Note', width: 260, wrap: true},
];

// Repeat the wide dataset so the table also overflows *vertically* — enough rows to exceed the
// bounded height in the `Scrolling` story and exercise the sticky header.
const CONTRACTS_TALL: Contract[] = Array.from({length: 5}, (_, i) =>
  CONTRACTS.map((c) => ({...c, id: c.id + i * 100}))
).flat();

const ContractActions = () => <ButtonsStack surface={'iconButton'} buttons={PARCEL_ACTIONS} />;

const meta: Meta<typeof DataTable> = {
  title: 'design/organisms/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A simple, read-only table for nested objects that are edited in bulk together with their ' +
          "parent — e.g. a property's parcels or building numbers. Deliberately plain: no " +
          'pagination, filtering, sorting or column resizing/hiding — just a header and rows, built ' +
          'from MUI `Table`/`TableRow`/`TableCell` so it inherits the shared table theme (a neutral ' +
          'header band, divider row borders) plus a hover tint on the body rows. Data-driven via ' +
          '`columns` + `rows`, each column optionally providing a `render`, with an optional trailing ' +
          'per-row actions column via `rowActions` (idle at 30%, full opacity on row hover — as in ' +
          '`DataGrid`). Like `DataGrid`, cells do not wrap by default (long content stays on one line ' +
          'and is reached via the horizontal scroll; opt a column back in with `column.wrap`) and the ' +
          'actions column is pinned to the right so the data scrolls under it. For full ' +
          'relations with their own paging, filters and editing use `DataGrid`; for bulk-editing ' +
          'these rows use the array form field. Purely presentational and Panel-agnostic — drop it ' +
          'inside a `Panel` (`PanelContent`, usually `paddingSize="none"`) or anywhere.',
      },
    },
    controls: {include: ['density', 'stripedRows', 'emptyMessage']},
  },
  argTypes: {
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
    stripedRows: {control: 'boolean'},
    emptyMessage: {
      control: 'text',
      description:
        'Only rendered once `rows` is empty — clearing the sample data here doubles as the ' +
        '`Empty` state demo (type something in to see it, in place of the "Parcels" story below).',
    },
  },
  args: {density: 'standard', stripedRows: false},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof DataTable>;

/**
 * Interactive instance — a multi-column table of nested objects (a property's parcels). `rows`
 * isn't a curatable control, so `emptyMessage` doubles as the switch for it: typing into
 * `emptyMessage` clears the sample rows to show the empty state (`emptyMessage` only ever renders
 * once `rows` is empty), matching exactly what the real component does with those two props.
 */
export const Playground: Story = {
  render: (args) => (
    <DataTable {...args} columns={PARCEL_COLUMNS} rows={args.emptyMessage ? [] : PARCELS} />
  ),
};

/** Multi-column — the "Parcels" panel content. */
export const Parcels: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <DataTable columns={PARCEL_COLUMNS} rows={PARCELS} />,
};

/** Striped rows — a subtle `action.hover` zebra on every other row; the hover tint still wins. */
export const Striped: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <DataTable stripedRows columns={PARCEL_COLUMNS} rows={PARCELS} />,
};

/** Single column — the "Building numbers" panel content. */
export const SingleColumn: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataTable<BuildingNumber>
      columns={[{key: 'value', header: 'Building number'}]}
      rows={BUILDING_NUMBERS}
    />
  ),
};

/** A `render` can return any node — e.g. a status chip instead of plain text. */
export const CustomCell: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataTable<Parcel>
      columns={[
        {key: 'number', header: 'Number'},
        {key: 'area', header: 'Area'},
        {
          key: 'hasBuilding',
          header: 'Building on parcel',
          render: (row) => (
            <Chip
              size={'small'}
              variant={'soft'}
              color={row.hasBuilding ? 'success' : 'default'}
              label={yesNo(row.hasBuilding)}
            />
          ),
        },
      ]}
      rows={PARCELS}
    />
  ),
};

/**
 * With per-row actions — a trailing, right-aligned actions column. The buttons idle at 30%
 * opacity and go full opacity while their row is hovered.
 */
export const WithRowActions: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <DataTable columns={PARCEL_COLUMNS} rows={PARCELS} rowActions={() => <ParcelActions />} />
  ),
};

/**
 * Scrolling in **both** directions (no wrapping `Panel` — see `InPanel` for that). The table owns its
 * scroll: constrained here to a narrow, short `Box` so it overflows on both axes.
 *
 * - **Horizontal** — cells don't wrap (like `DataGrid`), so content wider than the container scrolls
 *   sideways while the **actions column stays pinned** to the right and the data cells slide under it
 *   (the "Note" column opts back into wrapping via `column.wrap`).
 * - **Vertical** — with more rows than fit, the **header row stays fixed** (`<Table stickyHeader>`)
 *   with its opaque `background.default` band while only the body scrolls; the pinned actions column
 *   and its top-right corner stay put while scrolling both axes at once.
 */
export const Scrolling: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 560, height: 280}}>
      <DataTable
        columns={CONTRACT_COLUMNS}
        rows={CONTRACTS_TALL}
        rowActions={() => <ContractActions />}
      />
    </Box>
  ),
};

/**
 * Inside a `Panel` — full-bleed via `PanelContent paddingSize="none"`, so the header band
 * (`background.default`) and the row dividers span the panel edge to edge (how these tables appear
 * in a detail view).
 */
export const InPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Panel sx={{maxWidth: 640}}>
      <PanelHeader label={'Parcels'} icon={IconType.Domain} />
      <PanelContent paddingSize={'none'}>
        <DataTable columns={PARCEL_COLUMNS} rows={PARCELS} />
      </PanelContent>
    </Panel>
  ),
};

/** Empty state — a centered muted message spanning all columns. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <DataTable columns={PARCEL_COLUMNS} rows={[]} emptyMessage={'No parcels found'} />,
};
