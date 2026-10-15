import React from 'react';
import {Box, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {CloseButton} from './CloseButton';

const meta: Meta<typeof CloseButton> = {
  title: 'design/atoms/CloseButton',
  component: CloseButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A close (×) button pinned to the top-right of its nearest positioned ancestor. Drop it ' +
          'into any dismissible surface (dialog, inspector panel, popover) for a consistent close ' +
          'affordance. Position it by giving the parent `position: relative`.',
      },
    },
    controls: {include: ['disabled']},
  },
  argTypes: {
    disabled: {control: 'boolean', description: 'Disables the button.'},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof CloseButton>;

/** Anchored to a relatively-positioned surface — the intended usage. */
export const Playground: Story = {
  render: (args) => (
    <Box
      sx={{
        position: 'relative',
        width: 320,
        height: 160,
        borderRadius: (t) => `${t.radius.lg}px`,
        bgcolor: 'background.paper',
        p: 2,
      }}
    >
      <Typography variant={'subtitle1'} fontWeight={'fontWeightBold'}>
        Surface title
      </Typography>
      <Typography variant={'body2'} color={'text.secondary'}>
        The close button sits in the top-right corner.
      </Typography>
      <CloseButton {...args} />
    </Box>
  ),
};
