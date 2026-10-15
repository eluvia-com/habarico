import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, padDecorator} from '../../_storyKit';
import {DragHandle} from './DragHandle';

const meta: Meta<typeof DragHandle> = {
  title: 'design/molecules/DragHandle',
  component: DragHandle,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The shared drag affordance — a `DragIndicator` grip used by any surface that reorders ' +
          'via drag (datagrid rows, dashboard panels). Presentational only; the drag wiring lives ' +
          'on the surrounding element. While `loading` it swaps the grip for a spinner (a reorder ' +
          'being committed) and drops the `grab` cursor.',
      },
    },
    controls: {include: ['loading', 'size']},
  },
  argTypes: {
    loading: {control: 'boolean'},
    size: {control: {type: 'number', min: 12, max: 48}},
  },
  args: {loading: false, size: 20},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof DragHandle>;

/** Interactive instance — toggle `loading` and tweak `size`. */
export const Playground: Story = {};

/** The idle grip vs. the spinner shown while a reorder commits. */
export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      <DragHandle aria-label={'Drag to reorder'} />
      <DragHandle loading aria-label={'Reordering'} />
    </Row>
  ),
};
