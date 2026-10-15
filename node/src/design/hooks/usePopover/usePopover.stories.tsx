import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {Button, Popover as MuiPopover, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {usePopover} from './usePopover';

const meta: Meta<typeof MuiPopover> = {
  title: 'design/hooks/usePopover',
  component: MuiPopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Floating surface anchored to an element, opened via the design-layer `usePopover` hook. ' +
          'Click the button to open it.',
      },
    },
    // `component` is the underlying MUI `Popover`, and this story never reads args — without this,
    // Storybook auto-infers a full, entirely dead argTypes table.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof MuiPopover>;

// Generated once at module load so the body stays stable across re-renders.
const BODY_TEXT = new LoremIpsum().generateSentences(3);

// "Show code" only serializes the JSX `render` returns, never the `usePopover()` call itself, and
// the `Popover` it returns is an anonymous `useMemo` component (no `displayName`), so it'd
// otherwise print as `<Component>`.
const buildDefaultSource = () => `const {Popover, openPopover} = usePopover();

<>
  <Button variant="contained" onClick={openPopover}>
    Open popover
  </Button>
  <Popover>
    <Typography variant="body2" sx={{p: 2, maxWidth: 320}}>
      {bodyText}
    </Typography>
  </Popover>
</>`;

export const Default: Story = {
  parameters: {docs: {source: {transform: (_code: string) => buildDefaultSource()}}},
  render: (_args) => {
    const {Popover, openPopover} = usePopover();
    return (
      <>
        <Button variant={'contained'} onClick={openPopover}>
          Open popover
        </Button>
        <Popover>
          <Typography variant={'body2'} sx={{p: 2, maxWidth: 320}}>
            {BODY_TEXT}
          </Typography>
        </Popover>
      </>
    );
  },
};
