import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {Box, Divider, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

// Generated once at module load so the copy stays stable while playing with the Controls.
const lorem = new LoremIpsum();
const PARAGRAPH_ABOVE = lorem.generateSentences(3);
const PARAGRAPH_BELOW = lorem.generateSentences(3);

const meta: Meta<typeof Divider> = {
  title: 'design/atoms/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Thin rule separating content. Supports horizontal/vertical orientation, insets and an ' +
          'inline label.',
      },
    },
    controls: {include: ['orientation', 'variant', 'flexItem']},
  },
  argTypes: {
    orientation: {control: 'inline-radio', options: ['horizontal', 'vertical']},
    variant: {control: 'inline-radio', options: ['fullWidth', 'inset', 'middle']},
    flexItem: {
      control: 'boolean',
      description:
        'Needed whenever the divider sits inside a flex row — most commonly a **vertical** ' +
        'divider (see `orientation`): without it, MUI gives a vertical divider a computed height ' +
        'of 0 inside a flex container, so it renders nothing. Has no visible effect here unless ' +
        '`orientation` is also `vertical`.',
    },
  },
  args: {orientation: 'horizontal', variant: 'fullWidth'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Divider>;

/**
 * Interactive instance — drive every prop from the Controls panel. `orientation="vertical"` needs a
 * flex-row layout to have any height to render at all (see the `flexItem` control's description),
 * so the container switches shape with it — a stacked block of paragraphs for `horizontal`, a flex
 * row of two lines for `vertical`.
 */
export const Playground: Story = {
  render: (args) =>
    args.orientation === 'vertical' ? (
      <Stack direction={'row'} spacing={2} sx={{height: 40, alignItems: 'center'}}>
        <Typography variant={'body2'}>Left</Typography>
        <Divider {...args} />
        <Typography variant={'body2'}>Right</Typography>
      </Stack>
    ) : (
      <Box sx={{maxWidth: 360}}>
        <Typography variant={'body2'}>{PARAGRAPH_ABOVE}</Typography>
        <Divider {...args} sx={{my: 2}} />
        <Typography variant={'body2'}>{PARAGRAPH_BELOW}</Typography>
      </Box>
    ),
};

export const WithLabel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 360}}>
      <Typography variant={'body2'}>{PARAGRAPH_ABOVE}</Typography>
      <Divider sx={{my: 2}}>OR</Divider>
      <Typography variant={'body2'}>{PARAGRAPH_BELOW}</Typography>
    </Box>
  ),
};

export const Vertical: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack direction={'row'} spacing={2} sx={{height: 40}}>
      <Typography variant={'body2'}>Left</Typography>
      <Divider orientation={'vertical'} flexItem />
      <Typography variant={'body2'}>Middle</Typography>
      <Divider orientation={'vertical'} flexItem />
      <Typography variant={'body2'}>Right</Typography>
    </Stack>
  ),
};
