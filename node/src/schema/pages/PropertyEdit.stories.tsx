import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PROPERTIES_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven property **edit** form, generated from the mock schema: the `SchemaEdit` view reads
 * the resource's `edit` view schema and renders the same detail boxes as inputs inside the admin
 * `EditShell` form, pre-filled from the record. Landing route: `/estates/properties/1`.
 *
 * The schema-layer counterpart of `admin/pages/PropertyEdit` and `design/pages/PropertyEdit`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/PropertyEdit',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${PROPERTIES_RESOURCE}/1`} />,
};
