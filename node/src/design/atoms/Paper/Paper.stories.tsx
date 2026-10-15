import React from 'react';
import {Paper, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, padDecorator} from '../../_storyKit';

const ELEVATIONS = [0, 1, 2, 4, 8, 12, 16, 24];

const meta: Meta<typeof Paper> = {
  title: 'design/atoms/Paper',
  component: Paper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Base surface for cards, menus and panels. `elevation` drives the redesign shadow ramp; ' +
          'the `outlined` variant swaps the shadow for a border.',
      },
    },
    controls: {include: ['variant', 'elevation']},
  },
  argTypes: {
    variant: {control: 'inline-radio', options: ['elevation', 'outlined']},
    elevation: {control: {type: 'range', min: 0, max: 24, step: 1}},
  },
  args: {variant: 'elevation', elevation: 1},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Paper>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Paper
      {...args}
      sx={{
        width: 200,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant={'body2'}>Surface</Typography>
    </Paper>
  ),
};

export const Elevation: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row spacing={3}>
      {ELEVATIONS.map((elevation) => (
        <Paper
          key={elevation}
          elevation={elevation}
          sx={{
            width: 120,
            height: 88,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant={'caption'}>elevation={elevation}</Typography>
        </Paper>
      ))}
    </Row>
  ),
};

export const Outlined: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Paper variant={'outlined'} sx={{p: 3, maxWidth: 320}}>
      <Typography variant={'subtitle2'}>Outlined variant</Typography>
      <Typography variant={'body2'} color={'text.secondary'}>
        A border instead of a shadow.
      </Typography>
    </Paper>
  ),
};
