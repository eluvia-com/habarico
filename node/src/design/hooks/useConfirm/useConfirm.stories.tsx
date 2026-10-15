import React from 'react';
import {Button, Stack} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {useConfirm} from './useConfirm';

const meta: Meta = {
  title: 'design/hooks/useConfirm',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'React-Admin-free confirmation-dialog controller built on `ConfirmDialog`. Call ' +
          '`confirm(options)` to open a dialog scoped to one action, and render the returned ' +
          '`dialog` once. When `onConfirm` returns a promise the dialog stays open with a spinner ' +
          "until it settles — replicating React Admin's async `Confirm`. Like the other design " +
          'interaction hooks, it documents a single interaction demo rather than a Playground.',
      },
    },
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// "Show code" only serializes the JSX `render` returns, never the `useConfirm()` call itself, and
// `{dialog}` would print as whatever `ConfirmDialog` element the hook holds at mount (`open={false}`,
// empty `title`/`content`) rather than real, readable usage.
const buildDemoSource = () => `const {confirm, dialog} = useConfirm();

<Stack direction="row" spacing={2}>
  <Button
    variant="contained"
    color="error"
    onClick={() =>
      confirm({
        title: 'Delete record',
        content: 'Are you sure? This cannot be undone.',
        confirmLabel: 'Delete',
        confirmColor: 'error',
        onConfirm: () => deleteRecord(),
      })
    }
  >
    Delete (sync)
  </Button>
  <Button
    variant="contained"
    onClick={() =>
      confirm({
        title: 'Publish record',
        content: 'This will call the backend and may take a moment.',
        confirmLabel: 'Publish',
        confirmColor: 'success',
        onConfirm: () => publishRecord(),
      })
    }
  >
    Publish (async)
  </Button>
  {dialog}
</Stack>`;

/** Two triggers: a synchronous confirm and an async one that shows the loading state. */
export const Demo: Story = {
  parameters: {docs: {source: {transform: (_code: string) => buildDemoSource()}}},
  render: (_args) => {
    const {confirm, dialog} = useConfirm();
    return (
      <Stack direction={'row'} spacing={2}>
        <Button
          variant={'contained'}
          color={'error'}
          onClick={() =>
            confirm({
              title: 'Delete record',
              content: 'Are you sure? This cannot be undone.',
              confirmLabel: 'Delete',
              confirmColor: 'error',
              onConfirm: () => undefined,
            })
          }
        >
          Delete (sync)
        </Button>
        <Button
          variant={'contained'}
          onClick={() =>
            confirm({
              title: 'Publish record',
              content: 'This will call the backend and may take a moment.',
              confirmLabel: 'Publish',
              confirmColor: 'success',
              onConfirm: () => wait(1500),
            })
          }
        >
          Publish (async)
        </Button>
        {dialog}
      </Stack>
    );
  },
};
