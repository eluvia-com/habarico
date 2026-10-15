import React from 'react';
import {Box, Button, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Showcase, Section as StorySection, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {Panel} from '../Panel';
import {PanelContent} from '../PanelContent';
import {PanelHeader} from '../PanelHeader';
import {SectionContent} from '../SectionContent';
import {SectionFooter} from '../SectionFooter';
import {SectionHeader} from '../SectionHeader';
import {Section} from './Section';

const noop = () => {};

const ACTIONS: ButtonDefinition[] = [
  {label: 'Add', icon: IconType.Add, onClick: noop},
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
];

/** A three-dot overflow menu — the canonical actions slot. */
const MenuAction = () => <ButtonsStack surface={'iconButton'} maxVisible={1} buttons={ACTIONS} />;

/** Placeholder rows — a `Section` is full-bleed (no padding), so content sits flush. */
const SampleBody = () => (
  <Box>
    {['First value', 'Second value', 'Third value'].map((text) => (
      <Typography key={text} variant={'body2'} color={'text.secondary'}>
        {text}
      </Typography>
    ))}
  </Box>
);

type PlaygroundArgs = {
  label: string;
  actions: boolean;
  fullHeight: boolean;
  /** Hidden from Controls — only present so `Section`'s required `children` type-checks against
   * this file's real component/render split; the Playground always builds its own children. */
  children: React.ReactNode;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Lightweight, card-less counterpart to `Panel` — a plain flex-column container with no ' +
          'surface of its own (no border, shadow, background or body padding) that still groups a ' +
          'titled `SectionHeader` (label + actions) with full-bleed content. Use it where a ' +
          "`Panel`'s card chrome would be too heavy: an inline group inside another panel, or a " +
          'bare action-only header above a datagrid. Compose a `SectionHeader` as the first child ' +
          'and the body after it.',
      },
    },
    controls: {include: ['label', 'actions', 'fullHeight']},
  },
  argTypes: {
    label: {control: 'text'},
    actions: {control: 'boolean'},
    fullHeight: {control: 'boolean'},
  },
  args: {
    label: 'Items',
    actions: true,
    fullHeight: false,
    children: null,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Section>;

/**
 * Interactive instance — drive the section from the Controls panel. `fullHeight` sets
 * `height: 100%` on the `Section`, which only has something to stretch into given a
 * constrained-height ancestor (a real grid cell in the app) — the fixed-size, invisible box here
 * stands in for that: the `Section`'s own `background.paper` fill hugs its content when
 * `fullHeight` is off, and reaches the box's bottom edge when it's on.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({label, actions, fullHeight}) => (
    <Box sx={{maxWidth: 460, height: 280}}>
      <Section fullHeight={fullHeight} sx={{bgcolor: 'background.paper'}}>
        <SectionHeader label={label || undefined} actions={actions ? <MenuAction /> : undefined} />
        <SampleBody />
      </Section>
    </Box>
  ),
};

/**
 * Side by side with a `Panel`: same header (label + actions), but the `Section` drops the card
 * surface and body padding — a lighter grouping for the same content.
 */
export const VersusPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <StorySection title={'Panel — card surface + padded body'}>
        <Box sx={{width: 460}}>
          <Panel>
            <PanelHeader label={'Items'} actions={<MenuAction />} />
            <PanelContent>
              <SampleBody />
            </PanelContent>
          </Panel>
        </Box>
      </StorySection>
      <StorySection title={'Section — card-less, full-bleed body'}>
        <Box sx={{width: 460}}>
          <Section>
            <SectionHeader label={'Items'} actions={<MenuAction />} />
            <SampleBody />
          </Section>
        </Box>
      </StorySection>
    </Showcase>
  ),
};

/** With a `SectionFooter` — a card-less action bar under the body (footer supplies its own inset). */
export const WithFooter: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 460}}>
      <Section>
        <SectionHeader label={'Items'} actions={<MenuAction />} />
        <SectionContent>
          <SampleBody />
        </SectionContent>
        <SectionFooter sx={{px: 2, pb: 1}} right={<Button variant={'contained'}>Save</Button>} />
      </Section>
    </Box>
  ),
};

/** Nested inside a `Panel` — a card-less sub-group under a single card surface. */
export const NestedInPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 460}}>
      <Panel>
        <PanelHeader label={'Contract'} />
        <PanelContent>
          <Section sx={{mb: 2}}>
            <SectionHeader label={'Parties'} actions={<MenuAction />} />
            <SampleBody />
          </Section>
          <Section>
            <SectionHeader label={'Terms'} />
            <SampleBody />
          </Section>
        </PanelContent>
      </Panel>
    </Box>
  ),
};
