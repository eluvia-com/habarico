import React, {useState} from 'react';
import {Button} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {ConfirmDialog} from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'design/organisms/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Schema-agnostic, React-Admin-free confirmation dialog built on `CustomDialog` + the ' +
          'design `Button`/`LoadingButton`. Controlled and purely presentational — it takes ' +
          'already-resolved strings (translate at the call site) and the `loading` flag replicates ' +
          "React Admin's async confirm state (spinner + locked dialog). Open it from a hook with " +
          '`useConfirm`, or drive `open` yourself as shown below.',
      },
    },
    controls: {
      include: ['title', 'content', 'confirmLabel', 'cancelLabel', 'confirmColor', 'loading'],
    },
  },
  argTypes: {
    title: {control: 'text'},
    content: {control: 'text'},
    confirmLabel: {control: 'text'},
    cancelLabel: {control: 'text'},
    confirmColor: {
      control: 'select',
      options: ['primary', 'secondary', 'info', 'success', 'warning', 'error'],
    },
    loading: {control: 'boolean'},
  },
  args: {
    title: 'Delete record',
    content: 'Are you sure you want to delete this record? This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    confirmColor: 'error',
    loading: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

// `render` returns the local `ConfirmDialogDemo` helper (it owns the `open` state — see the
// "Hooks live in a top-level demo component" rule): a real, always-`open` `Dialog` is dangerous as
// story/docs scaffolding (scroll-lock + focus-trap fight the rest of the page — see
// `CustomDialogTitle`'s history), so the trigger-button pattern stays. "Show code" would otherwise
// show the wrapper's own tag, so `docs.source.transform` below rebuilds the real composed usage
// from the story's *current* args instead — reactive, unlike a static `docs.source.code` override.
const buildPlaygroundSource = (args: React.ComponentProps<typeof ConfirmDialog>) => `<ConfirmDialog
  open={open}
  onConfirm={() => setOpen(false)}
  onCancel={() => setOpen(false)}
  title=${JSON.stringify(args.title)}
  content=${JSON.stringify(args.content)}
  confirmLabel=${JSON.stringify(args.confirmLabel)}
  cancelLabel=${JSON.stringify(args.cancelLabel)}
  confirmColor=${JSON.stringify(args.confirmColor)}
  loading={${args.loading}}
/>`;

/** A trigger opens the dialog; drive its content and state from Controls. */
const ConfirmDialogDemo = (args: React.ComponentProps<typeof ConfirmDialog>) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={'contained'} color={'error'} onClick={() => setOpen(true)}>
        Delete record
      </Button>
      <ConfirmDialog
        {...args}
        open={open}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

/** Interactive instance — a trigger opens the dialog; drive its content and state from Controls. */
export const Playground: Story = {
  render: (args) => <ConfirmDialogDemo {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: React.ComponentProps<typeof ConfirmDialog>}) =>
          buildPlaygroundSource(args),
      },
    },
  },
};
