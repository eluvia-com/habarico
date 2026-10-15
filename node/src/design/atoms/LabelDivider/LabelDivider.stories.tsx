import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {LabelDivider} from './LabelDivider';

// Generated once at module load so the copy stays stable while playing with the Controls.
const lorem = new LoremIpsum();
const PARAGRAPH_ABOVE = lorem.generateSentences(3);
const PARAGRAPH_BELOW = lorem.generateSentences(3);

const ALIGNMENTS = ['left', 'center', 'right'] as const;

const meta: Meta<typeof LabelDivider> = {
  title: 'design/atoms/LabelDivider',
  component: LabelDivider,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A horizontal divider with a centered, overline-styled text label. Extends the MUI ' +
          '`Divider`, so `textAlign` positions the label and any other `Divider` prop passes ' +
          'through. Use it to separate sections of a form or page.',
      },
    },
    controls: {include: ['label', 'textAlign']},
  },
  argTypes: {
    label: {control: 'text'},
    textAlign: {control: 'inline-radio', options: ALIGNMENTS},
  },
  args: {label: 'Section', textAlign: 'center'},
  decorators: [padDecorator],
  render: (args) => (
    <>
      <Typography variant={'body2'}>{PARAGRAPH_ABOVE}</Typography>
      <LabelDivider {...args} />
      <Typography variant={'body2'}>{PARAGRAPH_BELOW}</Typography>
    </>
  ),
};

export default meta;

type Story = StoryObj<typeof LabelDivider>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Alignments: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {ALIGNMENTS.map((align) => (
        <Section key={align} title={align}>
          <LabelDivider label={'Section'} textAlign={align} />
        </Section>
      ))}
    </Showcase>
  ),
};
