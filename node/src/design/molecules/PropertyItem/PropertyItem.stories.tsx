import React from 'react';
import {Box, Link, OutlinedInput, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, padDecorator} from '../../_storyKit';
import {PropertyItem} from './PropertyItem';

const meta: Meta<typeof PropertyItem> = {
  title: 'design/molecules/PropertyItem',
  component: PropertyItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A single label + value/input pair. The value slot is layout-agnostic: pass a ' +
          'string/`<Typography>` for a read view or a bare input (`OutlinedInput`, `Autocomplete`, ' +
          '…) for an edit view — the item lays out the label identically, so one component drives ' +
          'both detail and form panels. With the default `auto` orientation the label sits above the ' +
          "value when the item is narrow and beside it when wide, decided from the item's own width " +
          'via a CSS container query (pin it with `horizontal` / `vertical`). Compose several inside ' +
          'a `PropertyList`. Panel-agnostic — usable in a `Panel`, a `Dialog` or anywhere.',
      },
    },
    controls: {include: ['label', 'help', 'orientation', 'labelWidth']},
  },
  argTypes: {
    label: {control: 'text'},
    help: {control: 'text'},
    orientation: {control: 'inline-radio', options: ['auto', 'horizontal', 'vertical']},
    labelWidth: {control: 'text'},
  },
  args: {label: 'Area', help: '', orientation: 'auto', labelWidth: '40%'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof PropertyItem>;

/**
 * Interactive instance — the container is capped at 260px, so `auto` stacks the label; pin
 * `horizontal` to place it beside the value, or widen the item to let `auto` flip on its own.
 */
export const Playground: Story = {
  render: (args) => (
    <Box sx={{maxWidth: 260}}>
      <PropertyItem {...args}>50 m²</PropertyItem>
    </Box>
  ),
};

/** Orientation is width-driven by default, but can be pinned per item. */
export const Orientation: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack spacing={4}>
      <Section
        title={'auto (default)'}
        description={
          'Label above the value when narrow, beside it when wide — from the item width.'
        }
      >
        <Stack direction={'row'} spacing={4}>
          <Box sx={{width: 220}}>
            <PropertyItem label={'Area'}>50 m²</PropertyItem>
          </Box>
          <Box sx={{width: 420}}>
            <PropertyItem label={'Area'}>50 m²</PropertyItem>
          </Box>
        </Stack>
      </Section>
      <Section title={'horizontal (pinned)'} description={'Always label beside value.'}>
        <Box sx={{width: 220}}>
          <PropertyItem label={'Area'} orientation={'horizontal'}>
            50 m²
          </PropertyItem>
        </Box>
      </Section>
      <Section title={'vertical (pinned)'} description={'Always label above value.'}>
        <Box sx={{width: 420}}>
          <PropertyItem label={'Area'} orientation={'vertical'}>
            50 m²
          </PropertyItem>
        </Box>
      </Section>
    </Stack>
  ),
};

/** The value slot takes any node — plain text, a colored status, a link or a bare input. */
export const ValueTypes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack spacing={2} sx={{maxWidth: 420}}>
      <PropertyItem label={'Layout'}>2 + 1</PropertyItem>
      <PropertyItem label={'Status'}>
        <Typography variant={'body2'} sx={{color: 'success.main'}}>
          Active
        </Typography>
      </PropertyItem>
      <PropertyItem label={'Bank account'}>
        <Link href={'#'}>319121488/0300</Link>
      </PropertyItem>
      <PropertyItem label={'Unit number'}>
        <OutlinedInput size={'small'} fullWidth defaultValue={'521Z2'} />
      </PropertyItem>
    </Stack>
  ),
};

/** A help tooltip is shown after the label when `help` is set. */
export const Help: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 420}}>
      <PropertyItem label={'Area'} help={'Floor area excluding balconies and terraces.'}>
        50 m²
      </PropertyItem>
    </Box>
  ),
};
