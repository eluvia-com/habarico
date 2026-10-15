import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import {InputAdornment, OutlinedInput, Stack} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const meta: Meta<typeof OutlinedInput> = {
  title: 'design/atoms/OutlinedInput',
  component: OutlinedInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Bordered input without the `TextField` label/helper wrapper — used in filters and ' +
          'toolbars.',
      },
    },
    controls: {include: ['placeholder', 'size', 'error', 'disabled']},
  },
  argTypes: {
    placeholder: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    error: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
  args: {placeholder: 'Placeholder', size: 'medium'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof OutlinedInput>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <OutlinedInput {...args} sx={{minWidth: 280}} />,
};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack spacing={2} sx={{maxWidth: 320}}>
      <OutlinedInput placeholder={'Default'} />
      <OutlinedInput defaultValue={'With value'} />
      <OutlinedInput
        placeholder={'With adornment'}
        startAdornment={
          <InputAdornment position={'start'}>
            <SearchIcon fontSize={'small'} />
          </InputAdornment>
        }
      />
      <OutlinedInput placeholder={'Error'} error />
      <OutlinedInput placeholder={'Disabled'} disabled />
      <OutlinedInput placeholder={'Small'} size={'small'} />
    </Stack>
  ),
};
