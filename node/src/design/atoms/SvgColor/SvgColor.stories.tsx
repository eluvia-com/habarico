import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, Row, SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';
import {SvgColor} from './SvgColor';

// A self-contained single-path glyph so the story has no external asset
// dependency — SvgColor masks whatever `src` points to and paints it with the
// current CSS color.
const SAMPLE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2 3 9v11a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V9z'/%3E%3C/svg%3E";

const COLOR_OPTIONS = ['default', ...COLOR_TYPES] as const;

const meta: Meta<typeof SvgColor> = {
  title: 'design/atoms/SvgColor',
  component: SvgColor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Masks an SVG `src` and paints it with `currentColor`, so its color follows the CSS ' +
          '`color` of the element. Use it to recolor a single-tone SVG to any palette color.',
      },
    },
    controls: {include: ['src', 'width', 'color']},
  },
  argTypes: {
    src: {control: 'text'},
    width: {control: {type: 'number', min: 12, max: 96, step: 2}},
  },
  args: {src: SAMPLE_SRC, width: 32},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof SvgColor>;

/** Story-only args: `color` isn't a real prop — `SvgColor` follows the CSS `color` of its `sx`, so
 * this maps the picked palette color onto `sx={{color}}` for the Controls panel. */
type PlaygroundArgs = {
  src: string;
  width?: number;
  color: (typeof COLOR_OPTIONS)[number];
};

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {color: 'default'},
  argTypes: {
    color: {control: 'select', options: COLOR_OPTIONS},
  },
  render: ({src, width, color}) => (
    <SvgColor
      src={src}
      width={width}
      sx={{color: color === 'default' ? 'text.primary' : `${color}.main`}}
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
        <SvgColor src={SAMPLE_SRC} width={32} sx={{color: c ? `${c}.main` : 'text.primary'}} />
      )}
    />
  ),
};

export const Sizes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      {[16, 24, 32, 48].map((w) => (
        <SvgColor key={w} src={SAMPLE_SRC} width={w} />
      ))}
    </Row>
  ),
};
