import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {OWNERS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven owner **edit** form, generated from the mock schema: the `SchemaEdit` view reads the
 * resource's `edit` view schema and renders the owner box as inputs inside the admin `EditShell`
 * form, pre-filled from the record. The `id` field is `readOnly` in the schema, so it renders as a
 * plain value among the editable inputs. Landing route: `/estates/owners/1`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/OwnerEdit',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${OWNERS_RESOURCE}/1`} />,
};
