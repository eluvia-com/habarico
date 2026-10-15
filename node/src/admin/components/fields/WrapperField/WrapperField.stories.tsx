import React from 'react';
import {Stack} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {EmailField} from '../EmailField/EmailField';
import {TextField} from '../TextField/TextField';
import {withFieldShell} from '../_storyKit';
import {WrapperField, WrapperFieldProps} from './WrapperField';

/**
 * Groups several display fields under a single labelled column — React Admin's `WrapperField`. Its own
 * `source` drives the column label / sort, while the wrapped children each read their own `source`
 * from the ambient record. The datagrid uses it to fold multiple fields into one column.
 */
const meta = {
  title: 'admin/fields/WrapperField',
  component: WrapperField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com'},
    controls: {include: ['label']},
  },
  argTypes: {
    label: {control: 'text'},
  },
  args: {
    source: 'firstName',
    label: 'Contact',
    children: (
      <Stack>
        <TextField source="firstName" />
        <TextField source="lastName" />
        <EmailField source="email" />
      </Stack>
    ),
  },
  decorators: [withFieldShell],
} satisfies Meta<WrapperFieldProps>;

export default meta;
type Story = StoryObj<WrapperFieldProps>;

export const Playground: Story = {};

/** A single wrapped field — the minimal use, just attaching one column label to one value. */
export const SingleChild: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    label: 'Name',
    children: <TextField source="firstName" />,
  },
};
