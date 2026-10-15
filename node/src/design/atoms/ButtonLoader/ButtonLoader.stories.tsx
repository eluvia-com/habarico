import React from 'react';
import {Box, useTheme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, ColorType, SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';
import {ButtonLoader, ButtonLoaderProps} from './ButtonLoader';

const SIZES = ['small', 'medium', 'large'] as const;

/**
 * `contained` tints the spinner with the palette's contrast text (white on most colors), so
 * showing it on the bare canvas makes it disappear in light mode. Wrap it in the same
 * color surface `LoadingButton` gives it so every variant stays legible on its own.
 */
const LoaderSwatch = ({size, color, variant}: ButtonLoaderProps) => {
  const theme = useTheme();
  const paletteColor: ColorType =
    color && COLOR_TYPES.includes(color as ColorType) ? (color as ColorType) : 'primary';
  return (
    <Box
      sx={{
        display: 'inline-flex',
        p: 1.5,
        borderRadius: 1,
        bgcolor: variant === 'contained' ? theme.palette[paletteColor].main : 'transparent',
      }}
    >
      <ButtonLoader size={size} color={color} variant={variant} />
    </Box>
  );
};

const meta: Meta<typeof ButtonLoader> = {
  title: 'design/atoms/ButtonLoader',
  component: ButtonLoader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Standalone spinner used inside `LoadingButton`. Sizes track the button `size` and the ' +
          'color follows the `color`/`variant` pair — `contained` uses the contrast text, others the main tone.',
      },
    },
    controls: {include: ['size', 'color', 'variant']},
  },
  argTypes: {
    size: {control: 'inline-radio', options: SIZES},
    color: {control: 'select', options: COLOR_TYPES},
    variant: {control: 'inline-radio', options: ['contained', 'outlined', 'text'] as const},
  },
  args: {size: 'medium', color: 'primary', variant: 'contained'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof ButtonLoader>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => <LoaderSwatch {...args} />,
};

export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SHOWCASE_COLORS}
      keyOf={(c) => c ?? 'default'}
      label={(c) => c ?? 'default'}
      render={(c) => <ButtonLoader color={c} variant={'outlined'} />}
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
      render={(s) => <ButtonLoader size={s} variant={'outlined'} />}
    />
  ),
};
