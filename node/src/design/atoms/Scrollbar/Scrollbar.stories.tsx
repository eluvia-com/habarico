import React from 'react';
import {Box, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {Scrollbar} from './Scrollbar';

// A framed, fixed-size viewport so the overflowing content forces the scrollbar to appear.
// It must be a flex column: `Scrollbar` fills its parent via `flexGrow: 1` / `minHeight: 0`
// rather than a `height: 100%`, so without a flex context it would grow to its content height
// and never clip or scroll.
const Frame = ({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      width,
      height,
      display: 'flex',
      flexDirection: 'column',
      border: (t) => `1px solid ${t.palette.divider}`,
      borderRadius: 1,
    }}
  >
    {children}
  </Box>
);

const meta: Meta<typeof Scrollbar> = {
  title: 'design/atoms/Scrollbar',
  component: Scrollbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A SimpleBar-based scroll container with themed, auto-hiding scrollbars. Give it a ' +
          'fixed-size parent and overflowing content to see the bars. `ResponsiveScrollbar` (same ' +
          'folder) wraps this and derives its `maxHeight` from its on-screen position for list views.',
      },
    },
    controls: {include: ['fillContent']},
  },
  argTypes: {
    fillContent: {
      control: 'boolean',
      description:
        "Makes SimpleBar's own content wrapper a full-height flex column, so content that is " +
        '*shorter* than the frame can still stretch to fill it (e.g. a child pinned to the bottom ' +
        'with `flexGrow`/`mt: auto`) instead of only occupying its own height. Only visible when ' +
        "the content doesn't already overflow — the Playground swaps in a short list to show it, " +
        'since it does nothing once content is already taller than the frame (no space left to fill).',
    },
  },
  args: {fillContent: false},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Scrollbar>;

/**
 * Interactive instance — `fillContent` off shows the default, real reason for `Scrollbar` to exist:
 * enough rows to overflow the frame and scroll. Switch it on and the content swaps to a short list
 * that fits the frame with room to spare, with a caption pinned to the bottom via `flexGrow` on the
 * spacer above it — that placement only works once `fillContent` gives the content area something
 * to stretch into.
 */
export const Playground: Story = {
  render: ({fillContent, ...args}) => {
    const rows = fillContent ? 3 : 12;
    return (
      <Frame width={280} height={200}>
        <Scrollbar fillContent={fillContent} {...args}>
          <Stack spacing={1} sx={{flexGrow: 1, p: 2}}>
            {Array.from({length: rows}, (_, i) => (
              <Typography key={i} variant={'body2'}>
                Row {i + 1}
              </Typography>
            ))}
            {fillContent && (
              <>
                <Box sx={{flexGrow: 1}} />
                <Typography variant={'caption'} color={'text.secondary'}>
                  Pinned to the bottom — only reaches it because fillContent is on.
                </Typography>
              </>
            )}
          </Stack>
        </Scrollbar>
      </Frame>
    );
  },
};

export const Vertical: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section
        title={'Vertical'}
        description={'Tall content in a short box scrolls on the y axis.'}
      >
        <Frame width={280} height={200}>
          <Scrollbar>
            <Stack spacing={1} sx={{p: 2}}>
              {Array.from({length: 30}, (_, i) => (
                <Typography key={i} variant={'body2'}>
                  Row {i + 1}
                </Typography>
              ))}
            </Stack>
          </Scrollbar>
        </Frame>
      </Section>
    </Showcase>
  ),
};

export const Horizontal: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section
        title={'Horizontal'}
        description={'Wide content in a narrow box scrolls on the x axis.'}
      >
        <Frame width={280} height={120}>
          <Scrollbar>
            <Box sx={{width: 900, p: 2}}>
              <Typography variant={'body2'} noWrap>
                This single line is far wider than its container, so the horizontal scrollbar
                appears along the bottom of the scroll area — drag it or scroll sideways to reveal
                the rest of the content.
              </Typography>
            </Box>
          </Scrollbar>
        </Frame>
      </Section>
    </Showcase>
  ),
};
