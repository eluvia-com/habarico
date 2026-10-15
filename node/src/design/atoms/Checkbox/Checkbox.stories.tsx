import React from 'react';
import {Checkbox, FormControlLabel, Stack} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';

const SIZES = ['small', 'medium'] as const;

const meta: Meta<typeof Checkbox> = {
  title: 'design/atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Boolean selection control. `color` maps to the semantic palette.',
      },
    },
    controls: {include: ['color', 'size', 'defaultChecked', 'disabled']},
  },
  argTypes: {
    color: {control: 'select', options: COLOR_TYPES},
    size: {control: 'inline-radio', options: SIZES},
    defaultChecked: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
  args: {color: 'primary', size: 'medium', defaultChecked: true},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

/**
 * Interactive instance — drive every prop from the Controls panel. `defaultChecked` is read once,
 * on mount, like any React `default*` prop — updating it later through the Controls panel changes
 * the arg but not the already-mounted DOM node, so the checkbox would look unresponsive. `key`
 * forces a remount whenever it changes so the Controls panel stays truthful for an inherently
 * uncontrolled prop.
 */
export const Playground: Story = {
  render: (args) => <Checkbox key={String(args.defaultChecked)} {...args} />,
};

export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SHOWCASE_COLORS}
      keyOf={(c) => c ?? 'default'}
      label={(c) => c ?? 'default'}
      render={(c) => <Checkbox color={c} defaultChecked />}
    />
  ),
};

export const Sizes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SIZES}
      keyOf={(s) => s}
      label={(s) => s}
      render={(s) => <Checkbox size={s} defaultChecked />}
    />
  ),
};

export const WithLabel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack>
      <FormControlLabel control={<Checkbox defaultChecked />} label={'Checked'} />
      <FormControlLabel control={<Checkbox />} label={'Unchecked'} />
      <FormControlLabel disabled control={<Checkbox />} label={'Disabled'} />
    </Stack>
  ),
};
