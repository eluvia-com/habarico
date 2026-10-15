import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {Icon, IconType} from '@design/atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '@design/molecules/ButtonsStack';
import {Card, CardContent, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {
  _accountMenuItems,
  _availableLanguages,
  _marketing,
  _menuItems,
  _status,
  _workspaces,
} from '../_mock';
import {LayoutMockProvider} from '../contexts/LayoutMockProvider';
import {HeaderActionsPortal} from '../shared/HeaderActions';
import {SearchContent} from '../shared/Search';
import {LayoutSearchResult, SearchContentComponentProps} from '../types';
import {DashboardContent} from './DashboardContent';
import {DashboardLayout} from './DashboardLayout';

const meta: Meta<typeof DashboardLayout> = {
  title: 'design/layouts/shells/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The authenticated application shell: collapsible navigation menu, top bar (search, ' +
          'notifications, account), breadcrumbs and a scrollable content region. ' +
          '`LayoutMockProvider` supplies demo menu items, user and notifications so the ' +
          'shell can be shown in isolation; the actual page content is composed on higher layers, ' +
          'so here the content area holds a placeholder. `logo` / `menu` / `account` / `workspaces` ' +
          '/ `language` / `search` need real data, so they stay fixed in the demo; the other slots ' +
          '(`appearance`, `arrangement`, `table`, `notifications`, `breadcrumbs`, `settings`) are ' +
          'plain `true | {...}` toggles and are wired to Controls.',
      },
    },
    controls: {
      include: ['appearance', 'arrangement', 'table', 'notifications', 'breadcrumbs', 'settings'],
    },
  },
  argTypes: {
    appearance: {
      control: 'boolean',
      description:
        'Color-mode section/toggle (demoed with `header: true`, so it also shows standalone).',
    },
    arrangement: {
      control: 'boolean',
      description:
        'Page-width section/toggle (demoed with `header: true`, so it also shows standalone).',
    },
    table: {
      control: 'boolean',
      description: 'Table density/striping section in the settings panel.',
    },
    notifications: {control: 'boolean', description: 'Notifications bell + panel.'},
    breadcrumbs: {control: 'boolean', description: 'Breadcrumb trail in the header.'},
    settings: {control: 'boolean', description: 'Settings bell + panel.'},
  },
  args: {
    appearance: true,
    arrangement: true,
    table: true,
    notifications: true,
    breadcrumbs: true,
    settings: true,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DashboardLayout>;

// Demo search slot: the real app wires the search content to a backend query; here it is
// fed static results so the top-bar search affordance can be shown in isolation. The
// toggle / backdrop / slide are hardcoded in the layout — the slot only supplies content.
const _searchResults: LayoutSearchResult[] = [
  {
    meta: {label: 'Users', icon: <Icon size={20} icon={IconType.Groups} />},
    objects: [
      {href: '/user/1', title: 'Jane Cooper', description: 'jane.cooper@example.com'},
      {href: '/user/2', title: 'Cody Fisher', description: 'cody.fisher@example.com'},
    ],
  },
  {
    meta: {label: 'Products', icon: <Icon size={20} icon={IconType.ShoppingCart} />},
    objects: [{href: '/product/42', title: 'Wireless headphones', description: 'SKU-42'}],
  },
];

const SearchDemo = ({onClose}: SearchContentComponentProps) => (
  <SearchContent searchResults={_searchResults} onClose={onClose} />
);

const noop = () => {};

// Demo of the view's global actions. On higher layers the schema view portals its (responsive)
// toolbar into the header via `LayoutDynamicContext.actionsContainer`; here we portal a
// representative composition — one full primary button plus an overflow `⋮` menu — into that same
// container with `ActionsContent`, so the header-actions region can be shown in isolation.
const HEADER_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, color: 'inherit', onClick: noop},
  {label: 'Duplicate', icon: IconType.Add, onClick: noop},
  {label: 'Archive', icon: IconType.Delete, color: 'error', onClick: noop},
  {label: 'Listing', icon: IconType.Handshake, onClick: noop},
];

const HeaderActionsDemo = () => (
  <HeaderActionsPortal>
    <ButtonsStack
      surface={'button'}
      variant={'contained'}
      maxVisible={1}
      buttons={HEADER_ACTIONS}
    />
  </HeaderActionsPortal>
);

const PlaceholderContent = () => (
  <Stack spacing={2}>
    <Typography variant={'h4'}>Dashboard</Typography>
    <Typography variant={'body2'} color={'text.secondary'}>
      Page content is composed on higher layers (schema-driven views). This story showcases the
      layout shell only.
    </Typography>
    <Stack direction={'row'} spacing={2} flexWrap={'wrap'} useFlexGap>
      {['Overview', 'Activity', 'Reports'].map((title) => (
        <Card key={title} sx={{width: 240}}>
          <CardContent>
            <Typography variant={'subtitle1'}>{title}</Typography>
            <Typography variant={'body2'} color={'text.secondary'}>
              Placeholder card
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  </Stack>
);

/** Interactive instance — toggle the optional header/panel slots from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <LayoutMockProvider>
      <DashboardLayout
        marketing={_marketing}
        status={_status}
        logo={{Component: HabaricoLogo}}
        menu={{items: _menuItems}}
        account={{menuItems: _accountMenuItems}}
        workspaces={{items: _workspaces}}
        language={{availableLanguages: _availableLanguages}}
        search={{Component: SearchDemo}}
        appearance={args.appearance ? {header: true} : undefined}
        arrangement={args.arrangement ? {header: true} : undefined}
        table={args.table}
        notifications={args.notifications}
        breadcrumbs={args.breadcrumbs}
        settings={args.settings}
      >
        <DashboardContent maxWidth={false}>
          <HeaderActionsDemo />
          <PlaceholderContent />
        </DashboardContent>
      </DashboardLayout>
    </LayoutMockProvider>
  ),
};
