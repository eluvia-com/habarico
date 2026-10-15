import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PROPERTIES_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven property **detail** (show), generated from the mock schema: the `SchemaShow` view
 * reads the resource's `show` view schema and renders the read-only detail boxes (property /
 * building / status) inside the admin `ShowShell`, resolving the owner relation. Landing route:
 * `/estates/properties/1/show`.
 *
 * The schema-layer counterpart of `admin/pages/PropertyDetail` and `design/pages/PropertyDetail`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/PropertyDetail',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${PROPERTIES_RESOURCE}/1/show`} />,
};
