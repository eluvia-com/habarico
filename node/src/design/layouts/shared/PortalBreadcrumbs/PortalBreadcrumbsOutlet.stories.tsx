import React, {ReactNode} from 'react';
import {MemoryRouter} from 'react-router-dom';
import {Icon, IconType} from '@design/atoms/Icon';
import {RouterLink} from '@design/atoms/RouterLink';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, padDecorator} from '../../../_storyKit';
import {LayoutDynamicProvider} from '../../contexts/LayoutDynamicContext';
import {LayoutBreadcrumb} from '../../types';
import {DataBreadcrumbs} from '../DataBreadcrumbs';
import {BreadcrumbsPortal} from './BreadcrumbsPortal';
import {PortalBreadcrumbIcon} from './PortalBreadcrumbIcon';
import {PortalBreadcrumbItem} from './PortalBreadcrumbItem';
import {PortalBreadcrumbsOutlet} from './PortalBreadcrumbsOutlet';

const meta: Meta<typeof PortalBreadcrumbsOutlet> = {
  title: 'design/layouts/shared/PortalBreadcrumbs',
  component: PortalBreadcrumbsOutlet,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The **portal-defined** breadcrumb trail — for the ones a deep view composes as JSX rather ' +
          'than feeding the layout a data trail. It has three pieces: `PortalBreadcrumbsOutlet` is the ' +
          'header slot (an empty `<ol>` that registers itself as the outlet); `BreadcrumbsPortal` ports ' +
          'a view’s breadcrumb JSX into that slot while keeping React context; and `PortalBreadcrumbItem` ' +
          'is the crumb building block (the counterpart to `DataBreadcrumbItem`). An optional ' +
          '`PortalBreadcrumbIcon`, portalled first, renders a leading icon before the trail — the ' +
          'counterpart to the `icon` slot of `DataBreadcrumbs`. It renders identically to the ' +
          'data-driven `DataBreadcrumbs`: muted router links, an emphasised current page, a ' +
          '`divider`-coloured dot between crumbs, and — past two crumbs — a collapsed `first … last` ' +
          'view whose `…` opens a popover with the hidden middle crumbs. `PortalBreadcrumbItem` does no ' +
          'text processing — wrap the label in `DynamicText` at the call site if it needs templating.',
      },
    },
    // `PortalBreadcrumbsOutlet` itself takes no props — the trail is portalled in as JSX, not
    // passed as args — so there is nothing for Controls to drive. Note: every `render` below still
    // declares an unused `_args` parameter — Storybook derives `__isArgsStory` from
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

type Story = StoryObj<typeof PortalBreadcrumbsOutlet>;

const _shortItems: LayoutBreadcrumb[] = [
  {title: 'Properties', path: '/properties'},
  {title: 'Byt č. 521/8, 2 + 1, Jihlavská 521/62, 140 00 Praha – Michle'},
];

const _items: LayoutBreadcrumb[] = [
  {title: 'Dashboard', path: '/'},
  {title: 'Properties', path: '/properties'},
  {title: 'Byt č. 521/8, 2 + 1, Jihlavská 521/62, 140 00 Praha – Michle'},
];

const _deepItems: LayoutBreadcrumb[] = [
  {title: 'Dashboard', path: '/'},
  {title: 'Properties', path: '/properties'},
  {title: 'Jihlavská 521/62', path: '/properties/1'},
  {title: 'Units', path: '/properties/1/units'},
  {title: 'Byt č. 521/8'},
];

/** A trail of `PortalBreadcrumbItem`s portalled into a `PortalBreadcrumbsOutlet`. */
const PortalTrail = ({items, icon}: {items: LayoutBreadcrumb[]; icon?: ReactNode}) => {
  const lastIndex = items.length - 1;
  return (
    <LayoutDynamicProvider currentUser={null}>
      <PortalBreadcrumbsOutlet />
      <BreadcrumbsPortal>
        {icon && <PortalBreadcrumbIcon>{icon}</PortalBreadcrumbIcon>}
        {items.map((item, index) => (
          <PortalBreadcrumbItem key={item.title} path={index < lastIndex ? item.path : undefined}>
            {item.title}
          </PortalBreadcrumbItem>
        ))}
      </BreadcrumbsPortal>
    </LayoutDynamicProvider>
  );
};

/** The outlet slot with a view’s crumbs portalled in — two crumbs, so nothing collapses. */
export const Default: Story = {
  render: () => <PortalTrail items={_shortItems} />,
};

/**
 * Past two crumbs the trail collapses to `first … last`; the `…` opens a popover listing the hidden
 * middle crumbs (a router link each when it has a path). Same rule and same look as `DataBreadcrumbs`.
 */
export const Collapsed: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Section title="Collapsed trails" description="More than two crumbs → first … last.">
      <Section title="Three crumbs — one hidden behind the …">
        <PortalTrail items={_items} />
      </Section>
      <Section title="Five crumbs — three hidden behind the …">
        <PortalTrail items={_deepItems} />
      </Section>
    </Section>
  ),
};

/**
 * With an optional leading icon (here a home link) before the trail — portal a
 * `PortalBreadcrumbIcon` as the first child, mirroring the `icon` slot of `DataBreadcrumbs`. The
 * icon is not a crumb, so it does not count towards the collapse threshold.
 */
export const WithIcon: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <PortalTrail
      icon={
        <RouterLink href="/" aria-label="Home" style={{display: 'inline-flex', color: 'inherit'}}>
          <Icon icon={IconType.Home} size={22} />
        </RouterLink>
      }
      items={_items}
    />
  ),
};

/**
 * The same trail built two ways — they render identically, collapse included. The **data** breadcrumb
 * feeds a `LayoutBreadcrumb[]` to `DataBreadcrumbs`, which maps each entry to a `DataBreadcrumbItem`.
 * The **portal** breadcrumb composes `PortalBreadcrumbItem`s as JSX and ports them through a
 * `PortalBreadcrumbsOutlet`. Use the portal form when a deep view needs to build its own crumbs
 * (e.g. schema-computed trails) while keeping React context.
 */
export const DataVsPortal: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <Section title="Data vs. portal" description="Identical output; different source.">
      <Section title="Data — DataBreadcrumbs (from a LayoutBreadcrumb[])">
        <DataBreadcrumbs items={_deepItems} />
      </Section>
      <Section title="Portal — PortalBreadcrumbsOutlet + PortalBreadcrumbItem (portalled JSX)">
        <PortalTrail items={_deepItems} />
      </Section>
    </Section>
  ),
};
