import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import {Avatar, Chip, ChipProps} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, Row, SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';

const VARIANTS = ['filled', 'outlined', 'soft', 'text'] as const;
const SIZES = ['small', 'medium'] as const;
const ADORNMENTS = ['none', 'icon', 'avatar', 'close'] as const;

/** Playground args — the real Chip props plus a story-only `adornment` switch. */
type PlaygroundArgs = ChipProps & {adornment: (typeof ADORNMENTS)[number]};

const meta: Meta<typeof Chip> = {
  title: 'design/atoms/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Compact element for tags, statuses and filters. Adds design-layer `soft` / `text` ' +
          'variants; `color` maps to the semantic palette.',
      },
    },
    controls: {include: ['variant', 'color', 'size', 'label', 'disabled']},
  },
  argTypes: {
    variant: {control: 'inline-radio', options: VARIANTS},
    color: {control: 'select', options: ['default', ...COLOR_TYPES]},
    size: {control: 'inline-radio', options: SIZES},
    label: {control: 'text'},
    disabled: {control: 'boolean'},
  },
  args: {variant: 'filled', color: 'default', size: 'medium', label: 'Label'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Chip>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {adornment: 'none'},
  argTypes: {
    adornment: {control: 'inline-radio', options: ADORNMENTS},
  },
  parameters: {
    controls: {include: ['variant', 'color', 'size', 'label', 'disabled', 'adornment']},
  },
  render: ({adornment, ...args}) => (
    <Chip
      {...args}
      icon={adornment === 'icon' ? <AddIcon /> : undefined}
      avatar={adornment === 'avatar' ? <Avatar>M</Avatar> : undefined}
      onDelete={adornment === 'close' ? () => {} : undefined}
    />
  ),
};

export const Variants: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={VARIANTS}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => <Chip variant={v} label={'Label'} />}
    />
  ),
};

export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SHOWCASE_COLORS}
      keyOf={(c) => c ?? 'default'}
      label={(c) => c ?? 'default'}
      secondary={{items: VARIANTS, keyOf: (v) => v, label: (v) => v}}
      render={(c, v) => <Chip color={c} variant={v} label={'Label'} />}
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
      render={(s) => <Chip size={s} label={'Label'} />}
    />
  ),
};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={['clickable', 'disabled'] as const}
      keyOf={(s) => s}
      label={(s) => s}
      render={(s) =>
        s === 'clickable' ? (
          <Chip label={'Clickable'} onClick={() => {}} />
        ) : (
          <Chip label={'Disabled'} disabled />
        )
      }
    />
  ),
};

/**
 * Adornments — a leading `icon`, an `avatar`, or a trailing delete (close) button — rendered across
 * every palette color so the icon/avatar/delete colouring can be checked per color.
 */
export const WithAdornment: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={['icon', 'avatar', 'close'] as const}
      keyOf={(s) => s}
      label={(s) => s}
      secondary={{items: VARIANTS, keyOf: (v) => v, label: (v) => v}}
      render={(s, v) => {
        if (s == 'icon') return <Chip variant={v} label={'Icon'} icon={<AddIcon />} />;
        if (s == 'avatar') return <Chip variant={v} label={'Avatar'} avatar={<Avatar>M</Avatar>} />;
        if (s == 'close') return <Chip variant={v} label={'Close'} onDelete={() => {}} />;
      }}
    />
  ),
};

/** A row of related chips — e.g. active filters. */
export const Group: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row spacing={1}>
      {['Label 1', 'Label 2', 'Label 3', 'Label 4'].map((label) => (
        <Chip key={label} label={label} onClick={() => {}} />
      ))}
    </Row>
  ),
};
