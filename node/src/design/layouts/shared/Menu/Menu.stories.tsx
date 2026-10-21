import React from 'react';
import {MemoryRouter, useLocation} from 'react-router-dom';
import {Box, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../../_storyKit';
import {_menuItems} from '../../_mock';
import {Menu} from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'design/layouts/shared/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The sidebar navigation of `DashboardLayout`, filled from its `menu` slot. A leaf item ' +
          'is a link. A group (an item with `items`) is not: a click on it opens or closes its ' +
          'sub-menu and navigates nowhere, so the page changes only once a child is picked. A ' +
          'group holding the current page starts open. In the collapsed rail a group opens its ' +
          'sub-menu on hover or on a click. The current location is printed under the menu.',
      },
    },
    controls: {include: []},
  },
  decorators: [
    padDecorator,
    (Story) => (
      <MemoryRouter initialEntries={['/user']}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Menu>;

const CurrentLocation = () => {
  const {pathname} = useLocation();
  return (
    <Typography variant={'caption'} color={'text.secondary'}>
      Current location: <code>{pathname}</code>
    </Typography>
  );
};

// `Menu` is what `DashboardLayout` renders from its `menu` slot, so the usage shown is the slot fed
// with the very items the canvas renders (`_menuItems`) — keep the two in sync.
const USAGE_CODE = `import {Chip} from '@mui/material';
import {DashboardLayout, Icon, IconType, LayoutMenuItem} from '@eluvia/habarico';

const menuItems: LayoutMenuItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <Icon width={22} icon={IconType.BarChart} />,
  },
  {
    title: 'User',
    href: '/user',
    icon: <Icon width={22} icon={IconType.Groups} />,
  },
  {
    // A group: a click opens its sub-menu, only the children navigate.
    title: 'Products',
    href: '/product',
    icon: <Icon width={22} icon={IconType.ShoppingCart} />,
    // Badge shown at the end of the row.
    info: <Chip color="error" variant="soft" size="small" label="+3" />,
    items: [
      {
        title: 'New products',
        href: '/product/new',
        icon: <Icon width={22} icon={IconType.ShoppingCart} />,
      },
      {
        title: 'Used products',
        href: '/product/used',
        icon: <Icon width={22} icon={IconType.ShoppingCart} />,
      },
    ],
  },
  {
    title: 'Product stock',
    href: '/product-stock',
    icon: <Icon width={22} icon={IconType.Warehouse} />,
    items: [
      {
        title: 'Stocked products',
        href: '/product-stock',
        icon: <Icon width={22} icon={IconType.Warehouse} />,
      },
    ],
  },
  {
    title: 'Blog',
    href: '/blog',
    icon: <Icon width={22} icon={IconType.Description} />,
  },
  {
    title: 'External link',
    href: 'https://habarico.com',
    icon: <Icon width={22} icon={IconType.Link} />,
  },
];

<DashboardLayout menu={{items: menuItems}}>{children}</DashboardLayout>`;

const MenuDemo = ({collapsed}: {collapsed?: boolean}) => (
  <Stack spacing={2} sx={{width: collapsed ? 88 : 280}}>
    <Box>
      <Menu items={_menuItems} collapsed={collapsed} />
    </Box>
    <CurrentLocation />
  </Stack>
);

/** Click "Products" — the group opens without leaving the current page; a child then navigates. */
export const Default: Story = {
  render: (args) => <MenuDemo collapsed={args.collapsed} />,
  parameters: {
    docs: {
      source: {code: USAGE_CODE},
    },
  },
};

/** The collapsed rail: a group opens its sub-menu beside the rail on hover or on a click. */
export const Collapsed: Story = {
  render: () => <MenuDemo collapsed />,
  parameters: {docs: {canvas: {sourceState: 'none'}}},
};
