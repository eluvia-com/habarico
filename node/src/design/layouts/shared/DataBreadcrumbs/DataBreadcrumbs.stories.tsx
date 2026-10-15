import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {Icon, IconType} from '@design/atoms/Icon';
import {RouterLink} from '@design/atoms/RouterLink';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../../_storyKit';
import {LayoutBreadcrumb} from '../../types';
import {DataBreadcrumbs} from './DataBreadcrumbs';

const meta: Meta<typeof DataBreadcrumbs> = {
  title: 'design/layouts/shared/DataBreadcrumbs',
  component: DataBreadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The layout breadcrumb trail. An optional leading `icon`, `divider`-coloured dot ' +
          'separators, and — when there are more than two crumbs — a collapsed `first … last` view ' +
          'whose `…` opens a popover listing the hidden middle crumbs. The trail is read from the ' +
          "layout's dynamic context in the app; the stories pass it directly via `items`. Crumbs " +
          'with a `path` render as client-side router links; the last one is the current page.',
      },
    },
    // `items`/`icon` are demo data/JSX, not values worth exposing as Controls — without this
    // Storybook auto-infers a full argTypes table the stories never wire up. Note: every `render`
    // below still declares an unused `_args` parameter — Storybook derives `__isArgsStory` from
    // `render.length > 0`, so a zero-arg `render: () => (...)` silently disables this filter (and
    // "Show code"'s dynamic JSX serialization, falling back to printing the story object's literal
    // source) regardless of what's set here.
    controls: {include: []},
  },
  decorators: [
    padDecorator,
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DataBreadcrumbs>;

const _twoItems: LayoutBreadcrumb[] = [
  {title: 'Properties', path: '/properties'},
  {title: 'Byt č. 521/8, 2 + 1, Jihlavská 521/62, 140 00 Praha – Michle'},
];

const _manyItems: LayoutBreadcrumb[] = [
  {title: 'Properties', path: '/properties'},
  {title: 'Praha', path: '/properties/praha'},
  {title: 'Michle', path: '/properties/praha/michle'},
  {title: 'Jihlavská 521/62', path: '/properties/praha/michle/521'},
  {title: 'Byt č. 521/8, 2 + 1'},
];

/** Two crumbs — both shown, separated by the dot. The last is the current page. */
export const Default: Story = {
  render: (_args) => <DataBreadcrumbs items={_twoItems} />,
};

/** With an optional leading icon (here a home link) before the trail. */
export const WithIcon: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <DataBreadcrumbs
      icon={
        <RouterLink href="/" aria-label="Home" style={{display: 'inline-flex', color: 'inherit'}}>
          <Icon icon={IconType.Home} size={22} />
        </RouterLink>
      }
      items={_twoItems}
    />
  ),
};

/**
 * More than two crumbs — collapsed to `first … last`. Click the `…` to open a popover
 * with the hidden middle crumbs.
 */
export const Collapsed: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <DataBreadcrumbs
      icon={
        <RouterLink href="/" aria-label="Home" style={{display: 'inline-flex', color: 'inherit'}}>
          <Icon icon={IconType.Home} size={22} />
        </RouterLink>
      }
      items={_manyItems}
    />
  ),
};
