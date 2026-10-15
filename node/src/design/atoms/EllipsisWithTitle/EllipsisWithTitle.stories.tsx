import React from 'react';
import {Box, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {EllipsisWithTitle} from './EllipsisWithTitle';

const LONG_TEXT = 'Byt č. 521/8, 2 + 1, Jihlavská 521/62, 140 00 Praha – Michle';
const SHORT_TEXT = 'Nemovitosti';

const meta: Meta<typeof EllipsisWithTitle> = {
  title: 'design/atoms/EllipsisWithTitle',
  component: EllipsisWithTitle,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Truncates its children with an ellipsis when they overflow `maxWidth`, revealing the ' +
          'full text in a tooltip — but only while it is actually clipped (hover the truncated ' +
          'example). Keeps long, variable-length labels (breadcrumbs, chips, titles) from pushing ' +
          'their container wider. `maxWidth` accepts a number / CSS length, or a responsive object ' +
          '(`{xs, sm, md, lg, xl}`).',
      },
    },
    controls: {include: ['maxWidth', 'children']},
  },
  argTypes: {
    maxWidth: {control: 'number'},
    children: {control: 'text'},
  },
  args: {maxWidth: 200, children: LONG_TEXT},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof EllipsisWithTitle>;

/** Drag `maxWidth` (or edit the text) to see it clip and reveal the tooltip on hover. */
export const Playground: Story = {
  render: (args) => <EllipsisWithTitle {...args} />,
};

/** Side by side: a label that fits (no tooltip) and one that overflows (ellipsis + tooltip). */
export const Overflow: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 240}}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Fits
        </Typography>
        <EllipsisWithTitle maxWidth={240}>{SHORT_TEXT}</EllipsisWithTitle>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Overflows — hover for the full title
        </Typography>
        <EllipsisWithTitle maxWidth={240}>{LONG_TEXT}</EllipsisWithTitle>
      </Box>
    </Box>
  ),
};
