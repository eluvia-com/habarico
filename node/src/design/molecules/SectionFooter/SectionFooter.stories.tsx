import React from 'react';
import {Box, Button, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {Section} from '../Section';
import {SectionContent} from '../SectionContent';
import {SectionHeader} from '../SectionHeader';
import {SectionFooter} from './SectionFooter';

/** Placeholder body used across the showcases. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'}>
    Section body.
  </Typography>
);

type PlaygroundArgs = {
  left: boolean;
  right: boolean;
};

// A `Section` has no padding of its own — the consumer supplies any inset via `sx` (see its docs).
// Applying it once here, on the `Section` root, keeps the header/body/footer flush with *each
// other* the way a real caller would; padding only the footer (and leaving the header/body flush)
// would misalign the footer's content against the header/body above it.
const SECTION_INSET = {px: 2, py: 1.5};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/SectionFooter',
  component: SectionFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card-less counterpart to `PanelFooter` — the footer of a `Section`. A `left`/`right` slot row ' +
          '(`space-between`; a right-only footer collapses to the right) with no surface, divider or padding ' +
          'of its own (the consumer supplies any inset via `sx`). Mirrors the schema `BoxToolbar`.',
      },
    },
    controls: {include: ['left', 'right']},
  },
  argTypes: {
    left: {control: 'boolean'},
    right: {control: 'boolean'},
  },
  args: {left: false, right: true},
  decorators: [padDecorator],
};

export default meta;

/**
 * Interactive instance — toggle the `left`/`right` slots from the Controls panel. Shown inside a
 * basic `Section` (it needs the surrounding body to read in context).
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({left, right}) => (
    <Box sx={{maxWidth: 460}}>
      <Section sx={SECTION_INSET}>
        <SectionHeader label={'Items'} />
        <SectionContent>
          <SampleBody />
        </SectionContent>
        <SectionFooter
          sx={{pt: 1}}
          left={
            left ? (
              <Button variant={'outlined'} color={'inherit'}>
                Back
              </Button>
            ) : undefined
          }
          right={right ? <Button variant={'contained'}>Save</Button> : undefined}
        />
      </Section>
    </Box>
  ),
};
