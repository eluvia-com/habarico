import React from 'react';
import SendIcon from '@mui/icons-material/Send';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';
import {LoadingButton} from './LoadingButton';

const VARIANTS = ['contained', 'outlined', 'text'] as const;
const SIZES = ['small', 'medium', 'large'] as const;
const LOADING_STATES = [false, true] as const;

const meta: Meta<typeof LoadingButton> = {
  title: 'design/atoms/LoadingButton',
  component: LoadingButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'MUI Button extended with a `loading` state. While loading it masks the content with ' +
          'an overlay and centers a `ButtonLoader` spinner tinted to match the variant and color.',
      },
    },
    controls: {include: ['variant', 'color', 'size', 'loading', 'disabled', 'children']},
  },
  argTypes: {
    variant: {control: 'inline-radio', options: VARIANTS},
    color: {control: 'select', options: COLOR_TYPES},
    size: {control: 'inline-radio', options: SIZES},
    loading: {control: 'boolean'},
    disabled: {control: 'boolean'},
    children: {control: 'text'},
  },
  args: {variant: 'contained', color: 'primary', size: 'medium', loading: true, children: 'Button'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof LoadingButton>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Variants: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={VARIANTS}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => (
        <LoadingButton variant={v} loading>
          Button
        </LoadingButton>
      )}
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
      render={(c) => (
        <LoadingButton variant={'contained'} color={c} loading>
          Button
        </LoadingButton>
      )}
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
      render={(s) => (
        <LoadingButton variant={'contained'} size={s} loading>
          Button
        </LoadingButton>
      )}
    />
  ),
};

export const Loading: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={LOADING_STATES}
      keyOf={(l) => (l ? 'loading' : 'idle')}
      label={(l) => (l ? 'loading' : 'idle')}
      render={(l) => (
        <LoadingButton variant={'contained'} endIcon={<SendIcon />} loading={l}>
          Button
        </LoadingButton>
      )}
    />
  ),
};
