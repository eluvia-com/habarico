import React from 'react';
import {Box, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Showcase, Section as StorySection, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {Section} from '../Section';
import {SectionHeader} from './SectionHeader';

const noop = () => {};

const ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
  {label: 'Share', icon: IconType.Handshake, onClick: noop},
];

/** A three-dot overflow menu — the canonical actions slot (all actions collapsed into the menu). */
const MenuAction = () => <ButtonsStack surface={'iconButton'} maxVisible={0} buttons={ACTIONS} />;

/** Several icon buttons side by side with a `⋮` overflow — via `ButtonsStack`. */
const MultiActions = () => <ButtonsStack surface={'iconButton'} maxVisible={2} buttons={ACTIONS} />;

/** Placeholder body — a `Section` is full-bleed, so consumers add their own padding. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'} sx={{pb: 1}}>
    Section body. A `Section` adds no padding — content sits flush unless it brings its own.
  </Typography>
);

type PlaygroundArgs = {
  label: string;
  actions: boolean;
  loading: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The header of a `Section`: a label and an optional right-aligned actions slot, ' +
          'sharing the `PanelHeader` rhythm so the two read as siblings. Unlike `PanelHeader` it ' +
          'is card-less and standalone — no surface, no bottom divider, no collapse toggle / icon / ' +
          'help affordance (those belong to `Panel`). The label is optional: omit it and pass only ' +
          '`actions` for a bare action-only header (e.g. a toolbar above a card-less list).',
      },
    },
    controls: {include: ['label', 'actions', 'loading']},
  },
  argTypes: {
    label: {control: 'text'},
    actions: {control: 'boolean'},
    loading: {control: 'boolean'},
  },
  args: {
    label: 'Basic properties',
    actions: true,
    loading: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof SectionHeader>;

/** Interactive instance — drive the header props from the Controls panel. */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({label, actions, loading}) => (
    <Box sx={{maxWidth: 460}}>
      <Section>
        <SectionHeader
          label={label || undefined}
          actions={
            actions ? (
              <ButtonsStack surface={'iconButton'} maxVisible={0} buttons={ACTIONS} />
            ) : undefined
          }
          loading={loading}
        />
        <SampleBody />
      </Section>
    </Box>
  ),
};

/** The header configurations, including the label-less action-only variant. */
export const Anatomy: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {(
        [
          {title: 'Label only', node: <SectionHeader label={'Label only'} />},
          {
            title: 'Label + actions',
            node: <SectionHeader label={'With actions'} actions={<MenuAction />} />,
          },
          {
            title: 'Label + multiple action buttons',
            node: <SectionHeader label={'With multiple actions'} actions={<MultiActions />} />,
          },
          {
            title: 'Action-only (no label) — a bare toolbar',
            node: <SectionHeader actions={<MultiActions />} />,
          },
          {
            title: 'Long label (wraps — actions pinned to the first line)',
            node: (
              <SectionHeader
                label={'A very long section title that does not fit on a single line and wraps'}
                actions={<MenuAction />}
              />
            ),
          },
          {
            title:
              'Loading (a spinner in a reserved slot beside the title — no shift, label never covered)',
            node: <SectionHeader label={'Recalculating…'} actions={<MenuAction />} loading />,
          },
        ] as const
      ).map(({title, node}) => (
        <StorySection key={title} title={title}>
          <Box sx={{width: 460}}>
            <Section>{node}</Section>
          </Box>
        </StorySection>
      ))}
    </Showcase>
  ),
};
