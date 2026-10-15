import React from 'react';
import {Link} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {VariantGrid, padDecorator} from '../../_storyKit';

const UNDERLINES = ['hover', 'always', 'none'] as const;
const LINK_COLORS = ['primary', 'secondary', 'error', 'inherit'] as const;

const meta: Meta<typeof Link> = {
  title: 'design/atoms/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Navigational text link. `underline` controls the hover/permanent underline; `color` ' +
          'maps to the palette.',
      },
    },
    controls: {include: ['underline', 'color', 'children']},
  },
  argTypes: {
    underline: {control: 'inline-radio', options: UNDERLINES},
    color: {control: 'select', options: LINK_COLORS},
    children: {control: 'text'},
  },
  args: {underline: 'hover', color: 'primary', children: 'Link', href: '#'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Link>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Underline: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={UNDERLINES}
      keyOf={(u) => u}
      label={(u) => `underline: ${u}`}
      render={(u) => (
        <Link href={'#'} underline={u}>
          Link
        </Link>
      )}
    />
  ),
};

export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={LINK_COLORS}
      keyOf={(c) => c}
      label={(c) => c}
      render={(c) => (
        <Link href={'#'} color={c}>
          Link
        </Link>
      )}
    />
  ),
};
