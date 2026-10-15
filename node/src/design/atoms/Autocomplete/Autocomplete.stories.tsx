import React from 'react';
import {Autocomplete, TextField} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import top100Films from './top100Films';

const meta: Meta<typeof Autocomplete> = {
  title: 'design/atoms/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Text input with a filtered dropdown of options; supports single and multiple selection.',
      },
    },
    controls: {include: ['disabled', 'size', 'multiple', 'disablePortal']},
  },
  argTypes: {
    disabled: {control: 'boolean'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    multiple: {control: 'boolean'},
    disablePortal: {control: 'boolean'},
  },
  // `disablePortal: false` (MUI's own default) lets the dropdown portal to `document.body`, so it
  // floats above the fixed-height docs canvas instead of being clipped by it — `disablePortal:
  // true` renders the listbox inline in the DOM flow, which the canvas's own height then clips to
  // one or two options. Toggle it on in the Controls panel to see that difference.
  args: {size: 'medium', disablePortal: false},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Autocomplete>;

/**
 * Interactive instance — drive every prop from the Controls panel. Uncontrolled (no `value`), so
 * MUI tracks the selection itself keyed on the `multiple` shape (a single value vs. an array) — it
 * doesn't expect that shape to change under it. `key={multiple}` forces a full remount instead of a
 * prop update when the Controls panel flips `multiple`, so MUI always mounts fresh for the shape
 * it's about to own; without it, flipping `multiple` after a value is already selected crashes
 * (`selectedValues is null`) because MUI's internal state is still holding the old shape.
 */
export const Playground: Story = {
  render: (args) => (
    <Autocomplete
      key={String(args.multiple)}
      {...args}
      options={top100Films}
      sx={{width: 300}}
      renderInput={(params) => <TextField {...params} label={'Movie'} />}
    />
  ),
};

export const Multiple: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Autocomplete
      multiple
      options={top100Films}
      defaultValue={[top100Films[0], top100Films[1]]}
      sx={{width: 320}}
      renderInput={(params) => <TextField {...params} label={'Movies'} />}
    />
  ),
};
