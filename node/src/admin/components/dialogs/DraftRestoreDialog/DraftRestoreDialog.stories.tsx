import React, {useState} from 'react';
import {Button} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {withDialogShell} from '../_storyKit';
import {DraftRestoreDialog} from './DraftRestoreDialog';

const meta: Meta<typeof DraftRestoreDialog> = {
  title: 'admin/dialogs/DraftRestoreDialog',
  component: DraftRestoreDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Confirmation shown by `DraftController` when a form mounts with a saved draft from a ' +
          'previous session. Built on the design `ConfirmDialog` (itself on `CustomDialog`) ' +
          'instead of a bare MUI `Dialog`. `onRestore` loads the draft; `onDiscard` — also the ' +
          'backdrop/escape action — starts over.',
      },
      // `render` returns the local `DraftRestoreDialogDemo` helper — "Show code" would otherwise
      // show that helper's tag, so this overrides it with the real usage (the dialog owns its own
      // state-free content; the caller only ever supplies `open`/`onRestore`/`onDiscard`).
      source: {
        code: `<DraftRestoreDialog
  open={open}
  onRestore={() => restoreDraft()}
  onDiscard={() => discardDraft()}
/>`,
      },
    },
    controls: {include: []},
  },
  decorators: [withDialogShell],
};

export default meta;

type Story = StoryObj<typeof DraftRestoreDialog>;

// Top-level component (never an inline arrow) so Storybook's "Show code" serializer, which
// re-invokes `render` outside the story's providers, never trips over a hook read outside context.
const DraftRestoreDialogDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={'contained'} onClick={() => setOpen(true)}>
        Open a form with a saved draft
      </Button>
      <DraftRestoreDialog
        open={open}
        onRestore={() => setOpen(false)}
        onDiscard={() => setOpen(false)}
      />
    </>
  );
};

/** Click the button to open it; both actions just close the dialog in this demo. */
export const Default: Story = {
  // `render` takes an (unused) parameter on purpose: Storybook infers `__isArgsStory` from the
  // function's arity (`render.length > 0`), and skips `controls.include` filtering entirely for a
  // zero-arity `render` — so a plain `() => ...` here would silently ignore the empty controls
  // table set below and fall back to showing every inferred prop.
  render: (_args) => <DraftRestoreDialogDemo />,
};
