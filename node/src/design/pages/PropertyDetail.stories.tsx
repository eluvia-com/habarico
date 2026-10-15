import React, {useState} from 'react';
import {Button, Stack, Tab, Tabs, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Icon, IconType} from '../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../molecules/ButtonsStack';
import {Panel} from '../molecules/Panel';
import {PanelContent} from '../molecules/PanelContent';
import {PanelHeader} from '../molecules/PanelHeader';
import {PropertyItem} from '../molecules/PropertyItem';
import {type DataTableColumn} from '../organisms/DataTable';
import {Gallery, type GalleryImage} from '../organisms/Gallery';
import {ObjectHero} from '../organisms/ObjectHero';
import {PanelGrid, PanelGridItem} from '../organisms/PanelGrid';
import {PageShell, SettingsDataTable, SettingsPropertyList} from './_shell';

/* -- hero + tabs -- */

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

/* -- "Address & parcels" tab content -- */

const photo = (seed: string, alt: string): GalleryImage => ({
  url: `https://picsum.photos/seed/${seed}/1200/900`,
  alt,
});

const IMAGES: GalleryImage[] = [
  photo('hab-room-1', 'Living room'),
  photo('hab-room-2', 'Kitchen'),
  photo('hab-room-3', 'Bedroom'),
  photo('hab-room-4', 'Bathroom'),
  photo('hab-room-5', 'Balcony'),
];

const LOCATION_PROPERTIES: {label: string; value: React.ReactNode}[] = [
  {label: 'Region', value: 'Prague'},
  {label: 'Municipality', value: 'Michle'},
  {label: 'District', value: 'Michle'},
  {label: 'ZIP code', value: '140 00'},
  {label: 'Street', value: 'Jihlavská'},
  {label: 'Number type', value: 'building no.'},
  {label: 'Number', value: '521'},
  {label: 'Orientation number', value: '62'},
];

type BuildingNumber = {value: string};

const BUILDING_NUMBERS: BuildingNumber[] = [
  {value: '218'},
  {value: '88'},
  {value: '320'},
  {value: '233'},
];

type Parcel = {number: string; area: string; hasBuilding: string; inTrust: string};

const PARCELS: Parcel[] = [
  {number: '2145', area: '200 m²', hasBuilding: 'Yes', inTrust: 'Yes'},
  {number: '2146', area: '308 m²', hasBuilding: 'Yes', inTrust: 'Yes'},
  {number: '2147', area: '308 m²', hasBuilding: 'Yes', inTrust: 'No'},
  {number: '2148', area: '198 m²', hasBuilding: 'No', inTrust: 'Yes'},
  {number: '2149', area: '212 m²', hasBuilding: 'Yes', inTrust: 'Yes'},
];

const PARCEL_COLUMNS: DataTableColumn<Parcel>[] = [
  {key: 'number', header: 'Number'},
  {key: 'area', header: 'Area'},
  {key: 'hasBuilding', header: 'Building on parcel'},
  {key: 'inTrust', header: 'In managed trust'},
];

const AddressAndParcelsTab = () => (
  <PanelGrid>
    <PanelGridItem xs={12} md={6}>
      <Panel fullHeight collapsible>
        <PanelHeader
          label={'Photos'}
          icon={IconType.Image}
          iconColor={'secondary'}
          actions={
            <Button
              size={'small'}
              variant={'contained'}
              startIcon={<Icon icon={IconType.Edit} size={18} />}
            >
              Manage photos
            </Button>
          }
        />
        <PanelContent paddingSize={'small'}>
          <Gallery images={IMAGES} />
        </PanelContent>
      </Panel>
    </PanelGridItem>

    <PanelGridItem xs={12} md={6}>
      <Panel fullHeight collapsible>
        <PanelHeader label={'Location'} />
        <PanelContent>
          <SettingsPropertyList columns={2}>
            {LOCATION_PROPERTIES.map((item) => (
              <PropertyItem key={item.label} label={item.label}>
                {item.value}
              </PropertyItem>
            ))}
          </SettingsPropertyList>
        </PanelContent>
      </Panel>
    </PanelGridItem>

    <PanelGridItem xs={12} md={6}>
      <Panel fullHeight collapsible>
        <PanelHeader label={'Note'} />
        <PanelContent>
          <Typography variant={'body2'} color={'text.secondary'}>
            Corner unit, entrance from the courtyard. Cellar cubicle no. 12 belongs to the flat.
          </Typography>
        </PanelContent>
      </Panel>
    </PanelGridItem>

    <PanelGridItem xs={12} md={6}>
      <Panel fullHeight collapsible>
        <PanelHeader label={'Other building numbers'} />
        <PanelContent paddingSize={'none'}>
          <SettingsDataTable<BuildingNumber>
            columns={[{key: 'value', header: 'Building number'}]}
            rows={BUILDING_NUMBERS}
          />
        </PanelContent>
      </Panel>
    </PanelGridItem>

    <PanelGridItem xs={12}>
      <Panel fullHeight collapsible>
        <PanelHeader label={'Parcels'} />
        <PanelContent paddingSize={'none'}>
          <SettingsDataTable columns={PARCEL_COLUMNS} rows={PARCELS} />
        </PanelContent>
      </Panel>
    </PanelGridItem>
  </PanelGrid>
);

/* -- page (hooks live here, not in a `render` arrow) -- */

const noop = () => {};

const HEADER_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Duplicate', icon: IconType.Add, onClick: noop},
  {label: 'Archive', icon: IconType.Delete, color: 'error', onClick: noop},
];

const PropertyDetailPage = () => {
  const [tab, setTab] = useState(0);
  return (
    <PageShell
      activePath={'/properties'}
      breadcrumbs={[
        {title: 'Dashboard', path: '/'},
        {title: 'Properties', path: '/properties'},
        {title: 'Jihlavská 521/62'},
      ]}
      headerActions={
        <ButtonsStack
          surface={'button'}
          variant={'contained'}
          maxVisible={1}
          buttons={HEADER_ACTIONS}
        />
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
        <AddressAndParcelsTab />
      </Stack>
    </PageShell>
  );
};

const meta: Meta<typeof PropertyDetailPage> = {
  title: 'design/pages/PropertyDetail',
  component: PropertyDetailPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof PropertyDetailPage>;

/**
 * The property detail screen — an `ObjectHero` header, a tab bar and the "Address & parcels"
 * tab: a photo `Gallery`, a location `PropertyList`, a note, other building numbers and a
 * parcels `DataTable`. A full-page composition of existing design-layer components.
 */
export const Default: Story = {};
