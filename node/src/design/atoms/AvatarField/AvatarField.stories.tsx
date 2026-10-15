import React from 'react';
import {fn} from 'storybook/test';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {AvatarField} from './AvatarField';

// A small embedded JPEG so the "filled" avatar renders without a network request.
const SAMPLE_IMAGE =
  'data:image/jpeg;base64,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';

// Reads the dropped file as a data URL and hands it back through `changeValue`, mirroring how a
// consumer would wire up `onSelectFiles` in a real form.
const handleSelectFiles = (acceptedFiles: File[], changeValue: (value: string) => void) => {
  const file = acceptedFiles[0];
  if (!file) return;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => changeValue(String(reader.result));
};

const meta: Meta<typeof AvatarField> = {
  title: 'design/atoms/AvatarField',
  component: AvatarField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Circular avatar with a react-dropzone upload area. Click or drop an image to set the ' +
          'value; hovering a populated avatar reveals a remove overlay. `onSelectFiles` turns the ' +
          'dropped file into the string `value` via the supplied `changeValue` callback.',
      },
    },
    controls: {include: ['value', 'size', 'error', 'addLabel', 'removeLabel', 'changeLabel']},
  },
  argTypes: {
    value: {control: 'text'},
    size: {control: {type: 'range', min: 64, max: 240, step: 2}},
    error: {control: 'boolean'},
    addLabel: {control: 'text'},
    removeLabel: {control: 'text'},
    changeLabel: {control: 'text'},
  },
  args: {
    size: 150,
    value: '',
    onSelectFiles: handleSelectFiles,
    onChange: fn().mockName('onChange'),
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof AvatarField>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (args) => (
    <Showcase>
      <Section title={'Filled'} description={'Hover to reveal the remove overlay.'}>
        <AvatarField {...args} value={SAMPLE_IMAGE} />
      </Section>
      <Section title={'Empty'} description={'Click or drop an image to upload.'}>
        <AvatarField {...args} value={''} />
      </Section>
      <Section title={'Error'} description={'Invalid state — the border turns red.'}>
        <AvatarField {...args} value={''} error />
      </Section>
    </Showcase>
  ),
};

export const Default: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {value: SAMPLE_IMAGE},
};

export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {value: ''},
};

/** A `value` that fails to load falls back to a broken-image icon instead of the browser's
 * default broken-image rendering. */
export const BrokenImage: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {value: 'https://example.invalid/missing.png'},
};
