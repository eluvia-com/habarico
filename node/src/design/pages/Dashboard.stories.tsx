import React from 'react';
import {useTheme} from '@mui/material';
import {PieChart} from '@mui/x-charts/PieChart';
import {Meta, StoryObj} from '@storybook/react-vite';
import {IconType} from '../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../molecules/ButtonsStack';
import {DashboardGrid, type DashboardGridPanel} from '../organisms/DashboardGrid';
import {type DataTableColumn} from '../organisms/DataTable';
import {PageShell, SettingsDataTable} from './_shell';

/* -- "Soon-ending contracts" widget -- */

type EndingContract = {endDate: string; property: string; tenant: string};

const ENDING_CONTRACTS: EndingContract[] = [
  {
    endDate: '31 Jul 2026',
    property: 'Flat 2670/8, Baarova 2670/13, Prague – Michle',
    tenant: 'Marek Horák',
  },
  {endDate: '31 Jul 2026', property: 'House, Karla Čapka 841, Nýrsko', tenant: 'Jan Bláha'},
  {
    endDate: '31 Jul 2026',
    property: 'Flat 3025/9, Vrchlického 3025/11, Prague – Michle',
    tenant: 'Jan Kolář',
  },
  {
    endDate: '31 Jul 2026',
    property: 'Flat 2670/3, Baarova 2670/13, Prague – Michle',
    tenant: 'Serhii Kovalenko',
  },
  {
    endDate: '31 Jul 2026',
    property: 'Flat 719/2, Blatenská 719/28, Prague – Lobzy',
    tenant: 'Yuliia Ivanova',
  },
];

const ENDING_COLUMNS: DataTableColumn<EndingContract>[] = [
  {key: 'endDate', header: 'End date'},
  {key: 'property', header: 'Property'},
  {key: 'tenant', header: 'Tenant'},
];

const noop = () => {};

/** A single "Detail" row action shared by the contract tables. */
const DetailAction = () => (
  <ButtonsStack
    surface={'iconButton'}
    buttons={[{label: 'Detail', icon: IconType.Visibility, onClick: noop}]}
  />
);

/* -- "Overdue contracts" widget -- */

type OverdueContract = {startDate: string; endDate: string; property: string};

const OVERDUE_CONTRACTS: OverdueContract[] = [
  {
    startDate: '1 Jan 2011',
    endDate: '31 Dec 2024',
    property: 'Flat 4, Staniční 795/33, Prague – Doubravka',
  },
  {
    startDate: '1 Feb 2015',
    endDate: '30 Sep 2024',
    property: 'Flat 897/21, Lábkova 897/9, Prague – Skvrňany',
  },
  {
    startDate: '20 Mar 2015',
    endDate: '30 Sep 2026',
    property: 'Flat 1447/2, Rychtaříkova 1447/52, Prague – Východ',
  },
  {
    startDate: '10 Jul 2015',
    endDate: '30 Jun 2026',
    property: 'Flat 2669/21, Heyrovského 2669/3, Prague – Jižní',
  },
];

const OVERDUE_COLUMNS: DataTableColumn<OverdueContract>[] = [
  {key: 'startDate', header: 'Start date'},
  {key: 'endDate', header: 'End date'},
  {key: 'property', header: 'Property'},
];

/* -- "Orders by client" pie widget -- */

// The theme hook lives in a top-level component (never inside a `render` arrow), so the
// "Show code" serializer only ever sees the tag — see the Storybook rules in CLAUDE.md.
const OrdersByClientChart = () => {
  const theme = useTheme();
  return (
    <PieChart
      series={[
        {
          data: [
            {id: 'renata', value: 18, label: 'Renata Šťastná', color: theme.palette.info.main},
            {
              id: 'sparktech',
              value: 82,
              label: 'SparkTECH s.r.o.',
              color: theme.palette.warning.main,
            },
          ],
          valueFormatter: (slice) => `${slice.value} orders`,
        },
      ]}
      height={260}
      margin={{top: 8, right: 8, bottom: 8, left: 8}}
    />
  );
};

/* -- dashboard grid layout -- */

const PANELS: DashboardGridPanel[] = [
  {
    id: 'ending',
    layout: {x: 0, y: 0, w: 6, h: 3},
    label: 'Soon-ending contracts',
    icon: IconType.Warning,
    iconColor: 'warning',
    help: 'Contracts ending within the next 30 days.',
    contentPaddingSize: 'none',
    content: (
      <SettingsDataTable
        columns={ENDING_COLUMNS}
        rows={ENDING_CONTRACTS}
        rowActions={() => <DetailAction />}
      />
    ),
  },
  {
    id: 'overdue',
    layout: {x: 6, y: 0, w: 6, h: 3},
    label: 'Overdue contracts',
    icon: IconType.Warning,
    iconColor: 'error',
    help: 'Contracts past their agreed end date.',
    contentPaddingSize: 'none',
    content: (
      <SettingsDataTable
        columns={OVERDUE_COLUMNS}
        rows={OVERDUE_CONTRACTS}
        rowActions={() => <DetailAction />}
      />
    ),
  },
  {
    id: 'orders',
    layout: {x: 0, y: 3, w: 6, h: 4},
    label: 'Orders by client',
    icon: IconType.BarChart,
    content: <OrdersByClientChart />,
  },
];

const HEADER_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit widgets', icon: IconType.Tune, onClick: noop},
];

const DashboardPage = () => (
  <PageShell
    activePath={'/'}
    breadcrumbs={[{title: 'Dashboard', path: '/'}]}
    headerActions={
      <ButtonsStack surface={'button'} variant={'contained'} buttons={HEADER_ACTIONS} />
    }
  >
    <DashboardGrid panels={PANELS} mode={'detail'} />
  </PageShell>
);

const meta: Meta<typeof DashboardPage> = {
  title: 'design/pages/Dashboard',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof DashboardPage>;

/**
 * The dashboard screen — the app shell with a detail-mode `DashboardGrid` holding two contract
 * tables and an "orders by client" pie chart, and an "Edit widgets" action in the header. A
 * full-page composition of existing design-layer components.
 */
export const Default: Story = {};
