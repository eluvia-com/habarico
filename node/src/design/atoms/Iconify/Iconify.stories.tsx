import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, VariantGrid, padDecorator} from '../../_storyKit';
import {Iconify} from './Iconify';

// Representative iconify names — any icon from the Iconify registry works.
const SAMPLE_ICONS = [
  'logos:google-icon',
  'mdi:account',
  'mdi:home',
  'eva:plus-fill',
  'eva:search-fill',
  'material-symbols:settings-rounded',
] as const;

const meta: Meta<typeof Iconify> = {
  title: 'design/atoms/Iconify',
  component: Iconify,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Thin `Box` wrapper around `@iconify/react`. Renders any icon from the Iconify registry ' +
          'by its string `icon` name; `width` sets a square size and `sx` styles the wrapper.',
      },
    },
    controls: {include: ['icon', 'width']},
  },
  argTypes: {
    // A select, not free text: an Iconify name that is not in the registry renders nothing at all,
    // so a half-typed one looks exactly like a broken component. These are the names the `Icons`
    // showcase below already proves resolve.
    icon: {control: 'select', options: SAMPLE_ICONS},
    width: {control: {type: 'number', min: 12, max: 96, step: 2}},
  },
  args: {icon: 'logos:google-icon', width: 24},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Iconify>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Icons: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SAMPLE_ICONS}
      keyOf={(i) => i}
      label={(i) => i}
      render={(i) => <Iconify icon={i} width={28} />}
    />
  ),
};

export const Sizes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      {[16, 24, 32, 48].map((w) => (
        <Iconify key={w} icon={'logos:google-icon'} width={w} />
      ))}
    </Row>
  ),
};
