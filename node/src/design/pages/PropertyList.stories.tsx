import React from 'react';
import {Autocomplete, Card, CardHeader, Chip, Stack, TextField} from '@mui/material';
import type {GridColDef} from '@mui/x-data-grid';
import {Meta, StoryObj} from '@storybook/react-vite';
import {IconType} from '../atoms/Icon';
import {SearchField} from '../atoms/SearchField';
import {ButtonDefinition, ButtonsStack} from '../molecules/ButtonsStack';
import {DataGridProvider} from '../organisms/DataGrid/DataGridProvider';
import {DataGridToolbar} from '../organisms/DataGrid/DataGridToolbar';
import {PageShell, SettingsDataGrid} from './_shell';

/* -- sample property rows -- */

type Property = {
  id: number;
  type: string;
  address: string;
  layout: string;
  area: string;
  owner: string;
  management: string;
  complete: boolean;
  active: boolean;
};

const PROPERTIES: Property[] = [
  {
    id: 1,
    type: 'Flat',
    address: 'Kyjovská 578/13, Prague – Michle',
    layout: '2 + 1',
    area: '52 m²',
    owner: 'Jiří Daněk',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 2,
    type: 'House',
    address: 'Karla Čapka 841, Nýrsko',
    layout: '5 + 1',
    area: '180 m²',
    owner: 'Eva Vohralíková',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 3,
    type: 'Flat',
    address: 'Baarova 2670/13, Prague – Michle',
    layout: '2 + kk',
    area: '48 m²',
    owner: 'Gabriela Bendová',
    management: 'manage',
    complete: false,
    active: true,
  },
  {
    id: 4,
    type: 'Flat',
    address: 'Vrchlického 3025/11, Prague – Michle',
    layout: '2 + 1',
    area: '55 m²',
    owner: 'Kateřina Pham',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 5,
    type: 'Land',
    address: 'Čechova 2125/27, Prague – Východ',
    layout: '—',
    area: '640 m²',
    owner: 'Miroslav Bureš',
    management: 'manage',
    complete: true,
    active: false,
  },
  {
    id: 6,
    type: 'Flat',
    address: 'Blatenská 719/28, Prague – Lobzy',
    layout: '1 + 1',
    area: '38 m²',
    owner: 'Petra Nováková',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 7,
    type: 'Apartment',
    address: 'Smetanova 210/7, Prague – Smíchov',
    layout: '3 + kk',
    area: '76 m²',
    owner: 'Ing. Jan Mareš',
    management: 'let / manage',
    complete: false,
    active: true,
  },
  {
    id: 8,
    type: 'Flat',
    address: 'Janská 5680/2, Prague – Sever',
    layout: '2 + kk',
    area: '46 m²',
    owner: 'Miroslav Bureš',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 9,
    type: 'Flat',
    address: 'Chařovická 3025/7, Prague – Michle',
    layout: '4 + 1',
    area: '112 m²',
    owner: 'Ing. Jana Malá',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 10,
    type: 'House',
    address: 'Americká 892/6, Prague – Východ',
    layout: '6 + 2',
    area: '220 m²',
    owner: 'Ing. Josef Krbec',
    management: 'manage',
    complete: true,
    active: true,
  },
  {
    id: 11,
    type: 'Flat',
    address: 'Dvořákova 419, Bezděkovské Předměstí, Bolevec',
    layout: '2 + 1',
    area: '58 m²',
    owner: 'Petr Havel',
    management: 'let / manage',
    complete: true,
    active: true,
  },
  {
    id: 12,
    type: 'Flat',
    address: 'U Vršků 837, Prague – Bory',
    layout: '1 + kk',
    area: '31 m²',
    owner: 'Petra Nováková',
    management: 'let / manage',
    complete: false,
    active: true,
  },
];

const yesNoChip = (value: boolean) => (
  <Chip
    size={'small'}
    variant={'soft'}
    color={value ? 'success' : 'default'}
    label={value ? 'Yes' : 'No'}
  />
);

const PROPERTY_COLUMNS: GridColDef<Property>[] = [
  {field: 'type', headerName: 'Type', width: 110},
  {field: 'address', headerName: 'Address', flex: 1, minWidth: 260},
  {field: 'layout', headerName: 'Layout', width: 100},
  {field: 'area', headerName: 'Area', width: 90},
  {field: 'owner', headerName: 'Owner', width: 170},
  {field: 'management', headerName: 'Involvement', width: 130},
  {
    field: 'complete',
    headerName: 'Complete',
    width: 110,
    sortable: false,
    renderCell: (params) => yesNoChip(params.row.complete),
  },
  {
    field: 'active',
    headerName: 'Active',
    width: 100,
    sortable: false,
    renderCell: (params) => yesNoChip(params.row.active),
  },
];

const noop = () => {};

const ROW_ACTIONS: ButtonDefinition[] = [
  {label: 'Detail', icon: IconType.Visibility, onClick: noop},
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
];

const RowActions = () => <ButtonsStack surface={'iconButton'} buttons={ROW_ACTIONS} />;

/* -- filter row above the grid -- */

const FilterBar = () => (
  <Stack
    direction={{xs: 'column', md: 'row'}}
    spacing={1.5}
    alignItems={{xs: 'stretch', md: 'center'}}
  >
    <SearchField placeholder={'Search'} size={'small'} sx={{flex: 1, minWidth: 220}} />
    <Autocomplete
      options={['Flat', 'House', 'Apartment', 'Land']}
      size={'small'}
      sx={{minWidth: 180}}
      renderInput={(params) => <TextField {...params} label={'Property type'} />}
    />
    <Autocomplete
      options={['let / manage', 'manage', 'let']}
      size={'small'}
      sx={{minWidth: 180}}
      renderInput={(params) => <TextField {...params} label={'Involvement'} />}
    />
    <Autocomplete
      options={['Active', 'Inactive']}
      size={'small'}
      sx={{minWidth: 150}}
      renderInput={(params) => <TextField {...params} label={'Status'} />}
    />
  </Stack>
);

const HEADER_ACTIONS: ButtonDefinition[] = [
  {label: 'Add property', icon: IconType.Add, onClick: noop},
];

const PropertyListPage = () => (
  <PageShell
    activePath={'/properties'}
    breadcrumbs={[
      {title: 'Dashboard', path: '/'},
      {title: 'Properties', path: '/properties'},
    ]}
    headerActions={
      <ButtonsStack surface={'button'} variant={'contained'} buttons={HEADER_ACTIONS} />
    }
  >
    <DataGridProvider>
      <Card>
        <CardHeader
          disableTypography
          title={<FilterBar />}
          action={<DataGridToolbar />}
          sx={{
            alignItems: 'center',
            gap: 2,
            p: 1,
            '& .MuiCardHeader-content': {minWidth: 0},
            '& .MuiCardHeader-action': {alignSelf: 'center', m: 0},
          }}
        />
        <SettingsDataGrid<Property>
          columns={PROPERTY_COLUMNS}
          rows={PROPERTIES}
          rowActions={() => <RowActions />}
          getRowHeight={() => 'auto'}
        />
      </Card>
    </DataGridProvider>
  </PageShell>
);

const meta: Meta<typeof PropertyListPage> = {
  title: 'design/pages/PropertyList',
  component: PropertyListPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof PropertyListPage>;

/**
 * The property list screen — a `Card` whose `CardHeader` holds the filters (left) and the
 * `DataGridToolbar` (right) above a full-width `DataGrid` of properties with per-row actions, plus
 * an "Add property" action in the app header. A full-page composition of existing design-layer
 * components.
 */
export const Default: Story = {};
