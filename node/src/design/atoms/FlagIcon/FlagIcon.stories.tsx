import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {VariantGrid, padDecorator} from '../../_storyKit';
import {FlagIcon} from './FlagIcon';

const CODES = ['cz', 'sk', 'gb', 'us', 'de', 'fr', 'it', 'es', 'pl', 'jp'] as const;

const meta: Meta<typeof FlagIcon> = {
  title: 'design/atoms/FlagIcon',
  component: FlagIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders a country/locale flag from an ISO 3166-1 alpha-2 `code` (case-insensitive). ' +
          'The image is loaded lazily from the country-flag-icons CDN. Use the Playground to pick a code.',
      },
    },
    controls: {include: ['code']},
  },
  argTypes: {
    code: {control: 'select', options: CODES},
  },
  args: {code: 'cz'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof FlagIcon>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Flags: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={CODES}
      keyOf={(c) => c}
      label={(c) => c.toUpperCase()}
      render={(c) => <FlagIcon code={c} />}
    />
  ),
};

/** An unmapped `code` 404s on the CDN — falls back to a generic flag icon instead of the
 * browser's broken-image glyph. */
export const BrokenImage: Story = {
  args: {code: 'xx'},
};
