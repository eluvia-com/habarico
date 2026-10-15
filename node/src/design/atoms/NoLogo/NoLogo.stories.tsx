import React from 'react';
import {Box} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, padDecorator} from '../../_storyKit';
import {NoLogo} from './NoLogo';

const meta: Meta<typeof NoLogo> = {
  title: 'design/atoms/NoLogo',
  component: NoLogo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An empty logo placeholder that resets all logo props. Use it as the logo slot ' +
          'when a layout should render no brand logo at all.',
      },
    },
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof NoLogo>;

/** Interactive instance — NoLogo takes no props, so it renders nothing. */
export const Playground: Story = {};

export const Placeholder: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      <Box sx={{p: 2, border: (t) => `1px dashed ${t.palette.divider}`}}>
        <NoLogo />
      </Box>
    </Row>
  ),
};
