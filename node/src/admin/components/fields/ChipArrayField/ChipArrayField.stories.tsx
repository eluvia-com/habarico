import React from 'react';
import type {Choices} from '@admin/utils/choices';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {ChipArrayField, ChipArrayFieldProps} from './ChipArrayField';

// Static enum the field resolves each array value against — the schema layer supplies this from the
// item schema in the real app, so the stories pass it inline.
const STATUS_CHOICES: Choices = [
  {value: 'active', label: 'Active', color: 'success'},
  {value: 'paused', label: 'Paused', color: 'warning'},
  {value: 'archived', label: 'Archived', color: 'error'},
];

const STATUS_CHOICES_WITH_ICONS: Choices = [
  {value: 'active', label: 'Active', color: 'success', icon: 'CheckCircle'},
  {value: 'paused', label: 'Paused', color: 'warning', icon: 'PauseCircle'},
  {value: 'archived', label: 'Archived', color: 'error', icon: 'Inventory2'},
];

/**
 * Read-only display for an array of scalar values — renders each as a soft `Chip` via `SingleFieldList`
 * + a private `ValueChip`. With `choices` the values resolve to their enum label/color/icon; without,
 * they render raw. Inside a collection (datagrid) the chips collapse to icon-only glyphs.
 */
const meta = {
  title: 'admin/fields/ChipArrayField',
  component: ChipArrayField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {
      statuses: ['active', 'paused', 'archived'],
      keywords: ['react', 'typescript', 'mui'],
    },
    controls: {include: ['label']},
  },
  argTypes: {
    label: {control: 'text'},
  },
  args: {
    source: 'statuses',
    label: 'Statuses',
    choices: STATUS_CHOICES,
  },
  decorators: [withFieldShell],
} satisfies Meta<ChipArrayFieldProps>;

export default meta;
type Story = StoryObj<ChipArrayFieldProps>;

export const Playground: Story = {};

/** No `choices` — the array values render as raw chips. */
export const PlainValues: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {source: 'keywords', label: 'Keywords', choices: undefined},
};

/** Every option carries an icon, so each chip shows an icon + label. */
export const WithIcons: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {choices: STATUS_CHOICES_WITH_ICONS},
};

/** Inside a collection the icon chips collapse to icon-only, tooltipped glyphs. */
export const InCollection: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {choices: STATUS_CHOICES_WITH_ICONS},
  decorators: [
    (Story) => (
      <ValueLocationContextProvider value={{isInCollection: true}}>
        <Story />
      </ValueLocationContextProvider>
    ),
  ],
};
