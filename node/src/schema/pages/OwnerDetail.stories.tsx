import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {OWNERS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven owner **detail** (show), generated from the mock schema: the `SchemaShow` view reads
 * the resource's `show` view schema and renders the read-only owner box (name / email / phone)
 * inside the admin `ShowShell`. Landing route: `/estates/owners/1/show`.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/OwnerDetail',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${OWNERS_RESOURCE}/1/show`} />,
};
