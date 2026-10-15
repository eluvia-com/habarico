import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {OWNERS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven owner **list**, generated entirely from the mock schema: the `SchemaList` view reads
 * the resource's `list` view schema (name / email / phone columns, default sorting) and renders the
 * admin `ListShell` + datagrid. Owners are the target of the property `owner` relation. Landing
 * route: `/estates/owners`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/OwnerList',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${OWNERS_RESOURCE}`} />,
};
