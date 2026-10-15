import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {OWNERS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven owner **create** form, generated from the mock schema: the `SchemaCreate` view reads
 * the resource's `create` view schema (fed by the `post` endpoint fields — first name / surname /
 * email / phone) and renders an empty form inside the admin `CreateShell`. Landing route:
 * `/estates/owners/create`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/OwnerCreate',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${OWNERS_RESOURCE}/create`} />,
};
