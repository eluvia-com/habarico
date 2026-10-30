import React from 'react';
import {LayoutDynamicProvider} from '@design/layouts/contexts/LayoutDynamicContext';
import {BreadcrumbsPortal, PortalBreadcrumbsOutlet} from '@design/layouts/shared/PortalBreadcrumbs';
import {
  CATEGORIES_RESOURCE,
  PRODUCTS_RESOURCE,
  redirectView,
  referenceTo,
} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {MenuSchema, ViewSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {ViewSchemaBreadcrumbs} from './ViewSchemaBreadcrumbs';

// A crumb is a `MenuSchema`. `link` crumbs carry their own url; `view` crumbs name a resource view
// and the component resolves the route from that resource's schema.
const linkCrumb = (name: string, label: string, url: string): MenuSchema => ({
  name,
  label,
  priority: 0,
  type: 'link',
  link: {url},
});

const viewCrumb = (name: string, label: string, resource: string, view: string): MenuSchema => ({
  name,
  label,
  priority: 0,
  type: 'view',
  view: {...redirectView(view), reference: referenceTo(resource)},
});

const TEXT_CRUMB: MenuSchema = {
  name: 'current',
  label: 'Mechanical Keyboard K2',
  priority: 0,
  type: 'text',
};

const TRAIL: MenuSchema[] = [
  linkCrumb('home', 'Dashboard', '/'),
  viewCrumb('categories', 'Categories', CATEGORIES_RESOURCE, 'list'),
  viewCrumb('products', 'Products', PRODUCTS_RESOURCE, 'list'),
  TEXT_CRUMB,
];

const viewWith = (breadcrumbs?: MenuSchema[]): ViewSchema => ({
  name: 'show',
  type: 'show',
  isDetail: true,
  label: 'Product',
  endpoint: {method: 'get'},
  breadcrumbs,
});

/**
 * The breadcrumbs are **portalled**: each crumb renders a `PortalBreadcrumbItem`, which appears
 * wherever the layout has put its `PortalBreadcrumbsOutlet`. In the real admin that outlet is in the
 * app bar, so a story has to mount one itself — otherwise the crumbs render into nothing.
 */
const BreadcrumbTrail = ({children}: {children: React.ReactNode}) => (
  <LayoutDynamicProvider currentUser={null}>
    <PortalBreadcrumbsOutlet />
    <BreadcrumbsPortal>{children}</BreadcrumbsPortal>
  </LayoutDynamicProvider>
);

/**
 * The **breadcrumb trail of a generated view**. It takes no props at all: it reads the current
 * `ViewSchema` and picks one of two sources.
 *
 * - **`viewSchema.breadcrumbs` set** → one `MenuSchemaBreadcrumb` per entry. The schema describes
 *   the trail explicitly, and each entry's `type` decides how it resolves:
 *   - `link` — the crumb links to `link.url` as given;
 *   - `view` — the crumb names a resource view, and the route is built from **that resource's own
 *     schema**; a view the resource does not declare falls through to a plain text crumb;
 *   - `text` — a label, no link. The last crumb in a trail is normally this.
 * - **`breadcrumbs` unset** → `RouteSchemaBreadcrumb`, which derives the trail from the current
 *   route instead. That is the default, and the reason most views need no breadcrumb schema at all.
 *
 * Both paths render `PortalBreadcrumbItem`s, so the trail appears in the layout's breadcrumb outlet
 * rather than where the component is mounted — the stories below mount an outlet to show it. Past
 * two crumbs the outlet collapses the middle into a `…` popover.
 */
const meta = {
  title: 'schema/breadcrumbs/ViewSchemaBreadcrumbs',
  component: ViewSchemaBreadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: {disable: true},
    schemaStory: {viewSchema: viewWith(TRAIL)},
  },
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** A two-crumb trail — short enough that nothing collapses. */
export const ShortTrail: Story = {
  parameters: {schemaStory: {viewSchema: viewWith([TRAIL[0], TEXT_CRUMB])}},
  render: () => (
    <BreadcrumbTrail>
      <ViewSchemaBreadcrumbs />
    </BreadcrumbTrail>
  ),
};

/** The full trail — past two crumbs the outlet collapses the middle into a `…` popover. */
export const CollapsedTrail: Story = {
  render: () => (
    <BreadcrumbTrail>
      <ViewSchemaBreadcrumbs />
    </BreadcrumbTrail>
  ),
};

/**
 * A `view` crumb naming a view the referenced resource does **not** declare. Rather than producing a
 * dead link, it degrades to a plain text crumb.
 */
export const UnresolvableViewCrumb: Story = {
  parameters: {
    schemaStory: {
      viewSchema: viewWith([
        TRAIL[0],
        viewCrumb('missing', 'No such view', CATEGORIES_RESOURCE, 'edit'),
        TEXT_CRUMB,
      ]),
    },
  },
  render: () => (
    <ShowcaseStack title={'ViewSchemaBreadcrumbs — a view crumb that does not resolve'}>
      <Showcase caption={"categories has no 'edit' view → a text crumb, not a link"}>
        <BreadcrumbTrail>
          <ViewSchemaBreadcrumbs />
        </BreadcrumbTrail>
      </Showcase>
    </ShowcaseStack>
  ),
};

/** `breadcrumbs` unset — the route-derived trail takes over. */
export const RouteDerived: Story = {
  parameters: {schemaStory: {viewSchema: viewWith(undefined)}},
  render: () => (
    <BreadcrumbTrail>
      <ViewSchemaBreadcrumbs />
    </BreadcrumbTrail>
  ),
};
