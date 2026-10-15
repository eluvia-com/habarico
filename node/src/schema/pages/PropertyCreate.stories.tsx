import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PROPERTIES_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven property **create** form, generated from the mock schema: the `SchemaCreate` view
 * reads the resource's `create` view schema (fed by the `post` endpoint fields) and renders an empty
 * form inside the admin `CreateShell`. Landing route: `/estates/properties/create`.
 *
 * Together with the list/detail/edit stories this exercises the full reserved-view set of the schema
 * layer from a single mock.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/PropertyCreate',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${PROPERTIES_RESOURCE}/create`} />,
};
