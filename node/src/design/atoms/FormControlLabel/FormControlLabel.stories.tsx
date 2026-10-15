import React from 'react';
import {Checkbox, FormControlLabel, Radio, Stack, Switch} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, padDecorator} from '../../_storyKit';

const PLACEMENTS = ['end', 'start', 'top', 'bottom'] as const;

const meta: Meta<typeof FormControlLabel> = {
  title: 'design/atoms/FormControlLabel',
  component: FormControlLabel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pairs a selection control (Checkbox / Radio / Switch) with a label, with configurable ' +
          'placement.',
      },
    },
    controls: {include: ['label', 'labelPlacement', 'disabled']},
  },
  argTypes: {
    label: {control: 'text'},
    labelPlacement: {control: 'inline-radio', options: PLACEMENTS},
    disabled: {control: 'boolean'},
  },
  args: {label: 'Label', labelPlacement: 'end'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof FormControlLabel>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <FormControlLabel {...args} control={<Checkbox defaultChecked />} />,
};

export const Controls: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack alignItems={'flex-start'}>
      <FormControlLabel control={<Checkbox defaultChecked />} label={'Checkbox'} />
      <FormControlLabel control={<Switch defaultChecked />} label={'Switch'} />
      <FormControlLabel control={<Radio defaultChecked />} label={'Radio'} />
      <FormControlLabel disabled control={<Checkbox />} label={'Disabled'} />
    </Stack>
  ),
};

export const Placements: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      {PLACEMENTS.map((placement) => (
        <FormControlLabel
          key={placement}
          labelPlacement={placement}
          control={<Checkbox defaultChecked />}
          label={placement}
        />
      ))}
    </Row>
  ),
};
