import type {Meta, StoryObj} from '@storybook/react-vite';
import {withInputShell} from '../_storyKit';
import {BooleanInput, BooleanInputProps} from './BooleanInput';

/**
 * Boolean input — React Admin's `BooleanInput` (a labelled switch) with the layer's spacing so it
 * lines up with the other inputs in a form. The schema layer maps it to the `boolean` format in
 * non-filter views (filters use `TriStateBooleanInput`).
 */
const meta = {
  title: 'admin/inputs/BooleanInput',
  component: BooleanInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['label', 'helperText', 'disabled']},
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    disabled: {control: 'boolean'},
  },
  args: {source: 'active', label: 'Active'},
  decorators: [withInputShell],
} satisfies Meta<BooleanInputProps>;

export default meta;
type Story = StoryObj<BooleanInputProps>;

export const Playground: Story = {parameters: {record: {active: true}}};
