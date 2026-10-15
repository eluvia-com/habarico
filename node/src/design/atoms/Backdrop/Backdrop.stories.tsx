import React, {useState} from 'react';
import {Backdrop, Button, CircularProgress, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const meta: Meta<typeof Backdrop> = {
  title: 'design/atoms/Backdrop',
  component: Backdrop,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dims and blocks the UI behind dialogs, drawers and loading states. Toggle it with the ' +
          'button below; click the backdrop to close.',
      },
    },
    controls: {include: ['invisible']},
  },
  argTypes: {
    invisible: {
      control: 'boolean',
      description: 'Keeps the dimming layer transparent while still blocking interaction.',
    },
  },
  args: {invisible: false},
  decorators: [padDecorator],
};

export default meta;
type Story = StoryObj<typeof Backdrop>;

/** Interactive instance — toggle `invisible` from the Controls panel. */
export const Playground: Story = {
  render: function BackdropPlayground({invisible}) {
    const [open, setOpen] = useState(false);
    return (
      <Stack spacing={2} alignItems={'flex-start'}>
        <Typography variant={'body2'} color={'text.secondary'}>
          The backdrop dims everything behind it.
        </Typography>
        <Button variant={'contained'} onClick={() => setOpen(true)}>
          Show backdrop
        </Button>
        <Backdrop
          open={open}
          invisible={invisible}
          onClick={() => setOpen(false)}
          sx={{zIndex: (t) => t.zIndex.drawer + 1}}
        >
          <CircularProgress color={'inherit'} />
        </Backdrop>
      </Stack>
    );
  },
};
