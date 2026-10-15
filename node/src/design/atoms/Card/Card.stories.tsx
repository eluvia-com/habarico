import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {Card, CardContent, CardHeader, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {VariantGrid, padDecorator} from '../../_storyKit';

// Generated once at module load so the copy stays stable while playing with the Controls.
const lorem = new LoremIpsum();
const BODY_LONG = lorem.generateSentences(6);
const BODY_MEDIUM = lorem.generateSentences(4);

const meta: Meta<typeof Card> = {
  title: 'design/atoms/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Root content surface — a themed `Paper` composing a header and content. `variant` ' +
          'toggles the elevated vs outlined look.',
      },
    },
    controls: {include: ['variant']},
  },
  argTypes: {
    variant: {control: 'inline-radio', options: ['elevation', 'outlined']},
  },
  args: {variant: 'elevation'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Card>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Card {...args} sx={{maxWidth: 400}}>
      <CardHeader title={'Card title'} />
      <CardContent>
        <Typography variant={'body2'}>{BODY_LONG}</Typography>
      </CardContent>
    </Card>
  ),
};

export const Variants: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={['elevation', 'outlined'] as const}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => (
        <Card variant={v} sx={{width: 280}}>
          <CardHeader title={'Card title'} />
          <CardContent>
            <Typography variant={'body2'}>{BODY_MEDIUM}</Typography>
          </CardContent>
        </Card>
      )}
    />
  ),
};
