import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import {InputAdornment, MenuItem, Stack, TextField} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const meta: Meta<typeof TextField> = {
  title: 'design/atoms/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Text input with label, helper text and validation. Renders an `OutlinedInput` ' +
          '(→ `InputBase`), so it also exercises those overrides.',
      },
    },
    controls: {
      include: ['label', 'placeholder', 'helperText', 'size', 'error', 'disabled', 'multiline'],
    },
  },
  argTypes: {
    label: {control: 'text'},
    placeholder: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    error: {control: 'boolean'},
    disabled: {control: 'boolean'},
    multiline: {control: 'boolean'},
  },
  args: {label: 'Label', placeholder: 'Placeholder', size: 'medium'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof TextField>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <TextField {...args} sx={{minWidth: 280}} />,
};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack spacing={2} sx={{maxWidth: 320}}>
      <TextField label={'Label'} placeholder={'Placeholder'} />
      <TextField label={'With helper'} helperText={'Helper text'} defaultValue={'Value'} />
      <TextField
        label={'Error'}
        error
        helperText={'Something is wrong'}
        defaultValue={'Bad value'}
      />
      <TextField label={'Disabled'} disabled defaultValue={'Disabled'} />
      <TextField
        label={'Search'}
        InputProps={{
          startAdornment: (
            <InputAdornment position={'start'}>
              <SearchIcon fontSize={'small'} />
            </InputAdornment>
          ),
        }}
      />
      <TextField label={'Multiline'} multiline minRows={3} />
      <TextField label={'Small'} size={'small'} />
    </Stack>
  ),
};

export const Select: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <TextField select label={'Select'} defaultValue={'1'} sx={{minWidth: 240}}>
      <MenuItem value={'1'}>Option one</MenuItem>
      <MenuItem value={'2'}>Option two</MenuItem>
      <MenuItem value={'3'}>Option three</MenuItem>
    </TextField>
  ),
};
