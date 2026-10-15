import React from 'react';
import {Box, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {Panel} from '../Panel';
import {PanelHeader} from '../PanelHeader';
import {PanelContent} from './PanelContent';

/** Placeholder body used across the showcases. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'}>
    Panel body. Compose any content here via <code>PanelContent</code> — form fields, a datagrid, a
    chart, nested panels, and so on.
  </Typography>
);

type PlaygroundArgs = {
  paddingSize: 'none' | 'small' | 'medium';
  /** Story-only: `PanelContent` needs a surrounding `Panel` to read in context, and its
   * `collapsible` toggle lives on that `Panel`, not on `PanelContent` itself. */
  collapsible: boolean;
  /** Hidden from Controls — only present so `PanelContent`'s required `children` type-checks
   * against this file's real component/render split; the Playground always builds its own. */
  children: React.ReactNode;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/PanelContent',
  component: PanelContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The body slot of a `Panel`. Applies a content gutter sized by `paddingSize` — `medium` ' +
          '(default), `small`, or `none` for full-bleed content like a datagrid — and, when the ' +
          'surrounding `Panel` is `collapsible`, collapses/expands with the header toggle. Must be ' +
          'rendered inside a `Panel`. Built on MUI `CardContent`.',
      },
    },
    controls: {include: ['paddingSize', 'collapsible']},
  },
  argTypes: {
    paddingSize: {control: 'inline-radio', options: ['none', 'small', 'medium']},
    collapsible: {control: 'boolean'},
  },
  args: {paddingSize: 'medium', collapsible: false, children: null},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof PanelContent>;

/** Interactive instance — drive the content props from the Controls panel. */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({paddingSize, collapsible}) => (
    <Box sx={{maxWidth: 460}}>
      <Panel collapsible={collapsible}>
        <PanelHeader label={'Panel title'} icon={IconType.House} />
        <PanelContent paddingSize={paddingSize}>
          <SampleBody />
        </PanelContent>
      </Panel>
    </Box>
  ),
};

/** The three `paddingSize` steps: `medium` (default) → `small` → `none` (full-bleed). */
export const Padding: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'medium (default)'}>
        <Box sx={{width: 460}}>
          <Panel>
            <PanelHeader label={'Medium padding'} icon={IconType.House} />
            <PanelContent paddingSize={'medium'}>
              <SampleBody />
            </PanelContent>
          </Panel>
        </Box>
      </Section>
      <Section title={'small'}>
        <Box sx={{width: 460}}>
          <Panel>
            <PanelHeader label={'Small padding'} icon={IconType.House} />
            <PanelContent paddingSize={'small'}>
              <SampleBody />
            </PanelContent>
          </Panel>
        </Box>
      </Section>
      <Section title={'none (full-bleed)'}>
        <Box sx={{width: 460}}>
          <Panel>
            <PanelHeader label={'Full-bleed content'} icon={IconType.List} />
            <PanelContent paddingSize={'none'}>
              <Stack divider={<Box sx={{borderTop: 1, borderColor: 'divider'}} />}>
                {['First row', 'Second row', 'Third row'].map((row) => (
                  <Box key={row} sx={{px: 2, py: 1.25}}>
                    <Typography variant={'body2'}>{row}</Typography>
                  </Box>
                ))}
              </Stack>
            </PanelContent>
          </Panel>
        </Box>
      </Section>
    </Showcase>
  ),
};
