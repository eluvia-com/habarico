import React from 'react';
import {Box, Stack} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {InputLayout} from './InputLayout';

// A stand-in for a custom control (e.g. `TreeSelect` / `UploadArea`) — the thing that has no MUI
// outline of its own and therefore needs `InputLayout` to supply the field frame.
const SampleContent = () => (
  <Stack spacing={0.5} sx={{py: 0.5, color: 'text.secondary', fontSize: 14}}>
    <Box>Custom control content</Box>
    <Box>— rendered inside the frame</Box>
  </Stack>
);

/**
 * The outlined "fieldset frame + legend label + helper text" chrome that MUI's outlined `TextField`
 * gives for free — for inputs that wrap a *custom* widget (no MUI outline of its own). Presentational
 * and React-Admin-free: pass the control as `children` and, in the admin layer, a React Admin
 * `<InputHelperText>` node as `helperText`. The admin `TreeArrayInput` and `UploadInput` both use it.
 */
const meta = {
  title: 'design/molecules/InputLayout',
  component: InputLayout,
  tags: ['autodocs'],
  parameters: {
    controls: {include: ['label', 'helperText', 'error', 'disabled', 'fullWidth']},
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    error: {control: 'boolean'},
    disabled: {control: 'boolean'},
    fullWidth: {control: 'boolean'},
  },
  args: {
    label: 'Field label',
    helperText: 'Helper text',
    error: false,
    disabled: false,
    fullWidth: true,
  },
  decorators: [padDecorator],
} satisfies Meta<typeof InputLayout>;

export default meta;
type Story = StoryObj<typeof InputLayout>;

export const Playground: Story = {
  render: (args) => (
    <Box sx={{width: 360}}>
      <InputLayout {...args}>
        <SampleContent />
      </InputLayout>
    </Box>
  ),
};

/** The field states side by side. */
export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 360}}>
      <Showcase>
        <Section title="Default">
          <InputLayout label="Field label" helperText="Helper text">
            <SampleContent />
          </InputLayout>
        </Section>
        <Section title="Error" description="Reddens the border, legend and helper text.">
          <InputLayout label="Field label" helperText="Invalid value" error>
            <SampleContent />
          </InputLayout>
        </Section>
        <Section title="Disabled" description="No hover highlight.">
          <InputLayout label="Field label" helperText="Helper text" disabled>
            <SampleContent />
          </InputLayout>
        </Section>
        <Section title="No label" description="Legend omitted when the label is empty.">
          <InputLayout helperText="Helper text">
            <SampleContent />
          </InputLayout>
        </Section>
      </Showcase>
    </Box>
  ),
};
