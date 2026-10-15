import React from 'react';
import {Box, Chip, Stack} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {GhostPanel} from './GhostPanel';

const ICON_OPTIONS = [IconType.Add, IconType.AddCircle, IconType.BarChart] as const;

const SampleBadges = () => (
  <>
    {['Table', 'Aggregate', 'Bar chart', 'Pie chart', 'Line chart'].map((label) => (
      <Chip key={label} label={label} size={'small'} color={'default'} variant={'soft'} />
    ))}
  </>
);

type PlaygroundArgs = {
  title: string;
  subtitle: string;
  icon: IconType;
  interactive: boolean;
  withBadges: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/GhostPanel',
  component: GhostPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A dashed placeholder surface — a centered icon, title, optional subtitle and optional ' +
          'badges inside a dashed rounded frame matching the (root) `Panel` corners. Used as an ' +
          'empty state or a quick "add" affordance (e.g. the add-panel tile in `DashboardGrid`). ' +
          'Fills its container; with `onClick` the whole surface is a button.',
      },
    },
    controls: {include: ['title', 'subtitle', 'icon', 'interactive', 'withBadges']},
  },
  argTypes: {
    title: {control: 'text'},
    subtitle: {control: 'text'},
    icon: {control: 'select', options: ICON_OPTIONS},
    interactive: {control: 'boolean'},
    withBadges: {control: 'boolean'},
  },
  args: {
    title: 'Add widget',
    subtitle: 'Select a widget type',
    icon: IconType.Add,
    interactive: true,
    withBadges: true,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof GhostPanel>;

/**
 * Interactive instance — drive the ghost's props from the Controls panel. `interactive` and
 * `withBadges` are story-only: they toggle the real `onClick`/`badges` slots, which take a
 * callback and a node rather than a primitive Controls can drive directly.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({title, subtitle, icon, interactive, withBadges}) => (
    <Box sx={{width: 440, height: 280}}>
      <GhostPanel
        icon={icon}
        title={title}
        subtitle={subtitle || undefined}
        badges={
          withBadges ? (
            <>
              <Chip label={'Table'} size={'small'} color={'default'} variant={'soft'} />
              <Chip label={'Aggregate'} size={'small'} color={'default'} variant={'soft'} />
              <Chip label={'Bar chart'} size={'small'} color={'default'} variant={'soft'} />
              <Chip label={'Pie chart'} size={'small'} color={'default'} variant={'soft'} />
              <Chip label={'Line chart'} size={'small'} color={'default'} variant={'soft'} />
            </>
          ) : undefined
        }
        onClick={interactive ? () => undefined : undefined}
      />
    </Box>
  ),
};

/** The building blocks: title only, + icon, + subtitle, + badges (as a clickable add tile). */
export const Anatomy: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack direction={'row'} spacing={2} flexWrap={'wrap'} useFlexGap>
      <Box sx={{width: 260, height: 200}}>
        <GhostPanel title={'Title only'} />
      </Box>
      <Box sx={{width: 260, height: 200}}>
        <GhostPanel icon={IconType.Add} title={'With icon'} />
      </Box>
      <Box sx={{width: 260, height: 200}}>
        <GhostPanel icon={IconType.Add} title={'Add widget'} subtitle={'Select a widget type'} />
      </Box>
      <Box sx={{width: 440, height: 240}}>
        <GhostPanel
          icon={IconType.Add}
          title={'Add widget'}
          subtitle={'Select a widget type'}
          badges={<SampleBadges />}
          onClick={() => undefined}
        />
      </Box>
    </Stack>
  ),
};

/**
 * Responsive behavior across shrinking tiles — the icon badge stays a perfect circle (never an
 * ellipse) and the badges that no longer fit inside the dashed frame are hidden instead of
 * overflowing it.
 */
export const Responsive: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack direction={'row'} spacing={2} flexWrap={'wrap'} useFlexGap alignItems={'flex-start'}>
      {[
        {w: 440, h: 260, label: '440 × 260'},
        {w: 280, h: 220, label: '280 × 220'},
        {w: 200, h: 200, label: '200 × 200'},
        {w: 160, h: 150, label: '160 × 150'},
      ].map(({w, h, label}) => (
        <Box key={label} sx={{width: w, height: h}}>
          <GhostPanel
            icon={IconType.Add}
            title={'Add widget'}
            subtitle={'Select a widget type'}
            badges={<SampleBadges />}
            onClick={() => undefined}
          />
        </Box>
      ))}
    </Stack>
  ),
};
