import React from 'react';
import {Resource, useGetList} from 'react-admin';
import {IconType} from '@design/atoms/Icon';
import {DashboardGrid, DashboardGridPanel} from '@design/organisms/DashboardGrid';
import {DataTable, DataTableColumn} from '@design/organisms/DataTable';
import {PieChart} from '@mui/x-charts/PieChart';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PROPERTY_TYPES, type Property} from './_data';
import {AdminStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

const PROPERTY_COLUMNS: DataTableColumn<Property>[] = [
  {key: 'type', header: 'Type'},
  {key: 'address', header: 'Address'},
  {key: 'area', header: 'Area', render: (row) => `${row.area} m²`},
  {key: 'involvement', header: 'Involvement'},
];

/**
 * The admin dashboard — a design `DashboardGrid` whose widgets are fed by **live** React Admin
 * data (`useGetList`), not static rows: a property table and a "by type" pie chart. Passed to
 * `<Admin dashboard=...>`, so it renders on the `/` route.
 */
const AdminDashboard = () => {
  const {data: properties = []} = useGetList<Property>('properties', {
    pagination: {page: 1, perPage: 100},
    sort: {field: 'id', order: 'ASC'},
  });

  const byType = PROPERTY_TYPES.map((type, index) => ({
    id: index,
    label: type,
    value: properties.filter((property) => property.type === type).length,
  })).filter((slice) => slice.value > 0);

  const panels: DashboardGridPanel[] = [
    {
      id: 'properties',
      layout: {x: 0, y: 0, w: 8, h: 4},
      label: 'Properties',
      icon: IconType.Home,
      content: <DataTable columns={PROPERTY_COLUMNS} rows={properties} />,
    },
    {
      id: 'by-type',
      layout: {x: 8, y: 0, w: 4, h: 4},
      label: 'Properties by type',
      icon: IconType.BarChart,
      content: (
        <PieChart
          height={220}
          series={[{data: byType, innerRadius: 40, paddingAngle: 2, cornerRadius: 4}]}
        />
      ),
    },
  ];

  return <DashboardGrid panels={panels} mode="detail" />;
};

const meta: Meta<typeof AdminDashboard> = {
  title: 'admin/pages/Dashboard',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof AdminDashboard>;

/**
 * Live React Admin dashboard: design `DashboardGrid` widgets driven by the data provider via
 * `useGetList`. The admin-layer counterpart of `design/pages/Dashboard` — same layout, but the
 * widgets read real React Admin data instead of static fixtures.
 */
export const Default: Story = {
  render: () => (
    <AdminStoryShell initialEntry="/" dashboard={AdminDashboard}>
      <Resource name="properties" recordRepresentation="address" />
    </AdminStoryShell>
  ),
};
