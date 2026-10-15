import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PROPERTIES_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven property **list**, generated entirely from the mock schema: the `SchemaList` view
 * reads the resource's `list` view schema (columns, filters, sorting) and renders the admin
 * `ListShell` + datagrid. Landing route: `/estates/properties`.
 *
 * The list view schema also wires the row-click gestures: `singleClickAction` docks a compact
 * `preview` show view into the side panel beside the table (quick info, `view.mode: sidepanel`),
 * while `doubleClickAction` opens the full `show` detail page (default `redirect`). This is the
 * schema-driven counterpart of the admin `PropertyList` side panel — here the whole interaction is
 * declared in the mock schema, not wired by hand.
 *
 * The schema-layer counterpart of `admin/pages/PropertyList` and `design/pages/PropertyList` — same
 * domain, but here nothing is wired by hand: columns, filters and the owner relation all come from
 * the backend schema mock.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/PropertyList',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${PROPERTIES_RESOURCE}`} />,
};
