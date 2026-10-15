import React, {useState} from 'react';
import {
  Autocomplete,
  Button,
  MenuItem,
  OutlinedInput,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Icon, IconType} from '../atoms/Icon';
import {Panel} from '../molecules/Panel';
import {PanelContent} from '../molecules/PanelContent';
import {PanelHeader} from '../molecules/PanelHeader';
import {PropertyItem} from '../molecules/PropertyItem';
import {type FormTableColumn} from '../organisms/FormTable';
import {ObjectHero} from '../organisms/ObjectHero';
import {PanelGrid, PanelGridItem} from '../organisms/PanelGrid';
import {PageShell, SettingsFormTable, SettingsPropertyList} from './_shell';

/* -- hero + tabs (Basic properties active) -- */

const HERO = {
  image: 'https://picsum.photos/seed/habarico/200/200',
  category: 'Property',
  title: 'Jihlavská 521/62, Prague – Michle',
  attributes: ['Unit 521/62', 'flat', '2 + 1', '50 m²', 'Petr Kašák'],
  metrics: [
    {value: 1, label: 'Management contract'},
    {value: 3, label: 'Lease agreements'},
  ],
  statuses: [
    {label: 'Active property'},
    {label: 'Profile complete', color: 'success' as const, icon: IconType.CheckCircle},
  ],
};

const TABS = [
  'Address & parcels',
  'Basic properties',
  'Owners',
  'Units',
  'Meters',
  'Others',
  'Handover & inspections',
  'Documents',
  'Deals & contracts',
  'Messages',
];

const LAYOUTS = ['1 + kk', '1 + 1', '2 + kk', '2 + 1', '3 + 1'];

/* -- "Basic properties" edit panel -- */

const BasicPropertiesForm = () => (
  <SettingsPropertyList columns={2} lineHeight={'smallInput'}>
    <PropertyItem label={'Residential unit'}>
      <Autocomplete
        options={['Yes', 'No']}
        defaultValue={'Yes'}
        size={'small'}
        renderInput={(params) => <TextField {...params} />}
      />
    </PropertyItem>
    <PropertyItem label={'Unit number'}>
      <TextField
        size={'small'}
        fullWidth
        defaultValue={'521Z2'}
        helperText={'Internal reference code.'}
      />
    </PropertyItem>
    <PropertyItem label={'Layout'}>
      <Autocomplete
        options={LAYOUTS}
        defaultValue={'2 + 1'}
        size={'small'}
        renderInput={(params) => <TextField {...params} />}
      />
    </PropertyItem>
    <PropertyItem label={'Area'}>
      <OutlinedInput size={'small'} fullWidth defaultValue={'50'} endAdornment={'m²'} />
    </PropertyItem>
    <PropertyItem label={'Floor number'}>
      <TextField
        size={'small'}
        fullWidth
        defaultValue={''}
        error
        helperText={'This field is required.'}
      />
    </PropertyItem>
    <PropertyItem label={'Number of floors'}>
      <OutlinedInput size={'small'} fullWidth defaultValue={'6'} />
    </PropertyItem>
  </SettingsPropertyList>
);

/* -- "Technical parameters" edit panel -- */

const TECH_FIELDS: {label: string; options: string[]; value: string}[] = [
  {label: 'Barrier-free access', options: ['Yes', 'No'], value: 'No'},
  {label: 'Heating', options: ['Central', 'Local', 'District'], value: 'District'},
  {
    label: 'Water heating',
    options: ['District hot water', 'Boiler', 'Flow heater'],
    value: 'District hot water',
  },
  {label: 'Gas', options: ['District gas', 'Bottled', 'None'], value: 'District gas'},
  {label: 'Sewerage', options: ['Central sewer', 'Septic tank', 'Cesspit'], value: 'Central sewer'},
];

const TechnicalParametersForm = () => (
  <SettingsPropertyList columns={1} lineHeight={'smallInput'}>
    {TECH_FIELDS.map((field) => (
      <PropertyItem key={field.label} label={field.label}>
        <Autocomplete
          options={field.options}
          defaultValue={field.value}
          size={'small'}
          renderInput={(params) => <TextField {...params} />}
        />
      </PropertyItem>
    ))}
  </SettingsPropertyList>
);

/* -- "Flat consists of" form table -- */

type Part = {type: string; note: string};

const TYPE_OPTIONS = ['Hallway', 'Room', 'Kitchen', 'Bathroom', 'Toilet'];

const INITIAL_PARTS: Part[] = [
  {type: 'Hallway', note: ''},
  {type: 'Room', note: ''},
  {type: 'Kitchen', note: 'incl. balcony'},
  {type: 'Bathroom', note: ''},
  {type: 'Toilet', note: ''},
];

const FlatPartsTable = () => {
  const [rows, setRows] = useState<Part[]>(INITIAL_PARTS);
  const setCell = (index: number, key: keyof Part, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? {...row, [key]: value} : row)));

  const columns: FormTableColumn<Part>[] = [
    {
      key: 'type',
      render: (row, i) => (
        <TextField
          select
          size={'small'}
          fullWidth
          label={'Type'}
          value={row.type}
          onChange={(e) => setCell(i, 'type', e.target.value)}
        >
          {TYPE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      key: 'note',
      render: (row, i) => (
        <OutlinedInput
          size={'small'}
          fullWidth
          placeholder={'Room state'}
          value={row.note}
          onChange={(e) => setCell(i, 'note', e.target.value)}
        />
      ),
    },
  ];

  return (
    <SettingsFormTable
      value={rows}
      onChange={setRows}
      columns={columns}
      createRow={() => ({type: '', note: ''})}
      addLabel={'Add'}
      countLabel={(count) => `${count} objects`}
    />
  );
};

/* -- "Handed-over keys" form table (conditional purpose cell) -- */

type Key = {label: string; type: string; purpose: string};

const INITIAL_KEYS: Key[] = [
  {label: '3', type: 'Chip', purpose: 'front door'},
  {label: '0', type: 'Key', purpose: ''},
  {label: '1', type: 'Key', purpose: 'mailbox'},
];

const KeysTable = () => {
  const [rows, setRows] = useState<Key[]>(INITIAL_KEYS);
  const setCell = (index: number, key: keyof Key, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? {...row, [key]: value} : row)));

  const columns: FormTableColumn<Key>[] = [
    {
      key: 'label',
      flex: 0.5,
      render: (row, i) => (
        <OutlinedInput
          size={'small'}
          fullWidth
          value={row.label}
          onChange={(e) => setCell(i, 'label', e.target.value)}
        />
      ),
    },
    {
      key: 'type',
      render: (row, i) => (
        <TextField
          select
          size={'small'}
          fullWidth
          label={'Type'}
          value={row.type}
          onChange={(e) => setCell(i, 'type', e.target.value)}
        >
          {['Chip', 'Key', 'Card'].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      key: 'purpose',
      render: (row, i) =>
        row.type === 'Chip' ? (
          <TextField
            size={'small'}
            fullWidth
            label={'Key purpose'}
            value={row.purpose}
            onChange={(e) => setCell(i, 'purpose', e.target.value)}
          />
        ) : null,
    },
  ];

  return (
    <SettingsFormTable
      value={rows}
      onChange={setRows}
      columns={columns}
      createRow={() => ({label: '', type: 'Key', purpose: ''})}
      addLabel={'Add'}
      countLabel={(count) => `${count} objects`}
    />
  );
};

/* -- page -- */

const noop = () => {};

const PropertyEditPage = () => {
  const [tab, setTab] = useState(1);
  return (
    <PageShell
      activePath={'/properties'}
      breadcrumbs={[
        {title: 'Dashboard', path: '/'},
        {title: 'Properties', path: '/properties'},
        {title: 'Jihlavská 521/62'},
        {title: 'Edit'},
      ]}
      headerActions={
        <Stack direction={'row'} spacing={1}>
          <Button
            color={'inherit'}
            startIcon={<Icon icon={IconType.Close} size={18} />}
            onClick={noop}
          >
            Cancel
          </Button>
          <Button
            variant={'contained'}
            color={'success'}
            startIcon={<Icon icon={IconType.CheckCircle} size={18} />}
            onClick={noop}
          >
            Save
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <ObjectHero {...HERO} />
        <Tabs
          value={tab}
          onChange={(_event, next) => setTab(next)}
          variant={'scrollable'}
          scrollButtons={'auto'}
        >
          {TABS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>

        <PanelGrid>
          <PanelGridItem xs={12} md={6}>
            <Panel fullHeight>
              <PanelHeader label={'Basic properties'} />
              <PanelContent>
                <BasicPropertiesForm />
              </PanelContent>
            </Panel>
          </PanelGridItem>
          <PanelGridItem xs={12} md={6}>
            <Panel fullHeight>
              <PanelHeader label={'Technical parameters'} />
              <PanelContent>
                <TechnicalParametersForm />
              </PanelContent>
            </Panel>
          </PanelGridItem>
        </PanelGrid>

        <Panel>
          <PanelHeader label={'Flat consists of'} />
          <PanelContent>
            <FlatPartsTable />
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader label={'Handed-over keys'} />
          <PanelContent>
            <KeysTable />
          </PanelContent>
        </Panel>

        <Stack direction={'row'} spacing={1} justifyContent={'flex-end'}>
          <Button
            color={'inherit'}
            startIcon={<Icon icon={IconType.Close} size={18} />}
            onClick={noop}
          >
            Cancel
          </Button>
          <Button
            variant={'contained'}
            color={'success'}
            startIcon={<Icon icon={IconType.CheckCircle} size={18} />}
            onClick={noop}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </PageShell>
  );
};

const meta: Meta<typeof PropertyEditPage> = {
  title: 'design/pages/PropertyEdit',
  component: PropertyEditPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof PropertyEditPage>;

/**
 * The property edit screen — the "Basic properties" tab active, with two edit `PropertyList`
 * panels (one field showing an error state), plus "Flat consists of" and "Handed-over keys"
 * `FormTable`s, and Cancel / Save actions in both the header and a footer below the form. A
 * full-page composition of existing design-layer components.
 */
export const Default: Story = {};
