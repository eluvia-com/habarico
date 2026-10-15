import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {DOCUMENTS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven document **list**, generated entirely from the mock schema: the `SchemaList` view
 * reads the resource's `list` view schema (title / category chip / property relation / issued date /
 * amount in CZK / signed flag columns, search + category + signed filters, date sorting) and renders
 * the admin `ListShell` + datagrid. Landing route: `/estates/documents`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/DocumentList',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${DOCUMENTS_RESOURCE}`} />,
};
