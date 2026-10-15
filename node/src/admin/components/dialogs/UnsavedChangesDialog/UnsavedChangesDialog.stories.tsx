import React, {useState} from 'react';
import {Button} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {withDialogShell} from '../_storyKit';
import {UnsavedChangesDialog} from './UnsavedChangesDialog';

const meta: Meta<typeof UnsavedChangesDialog> = {
  title: 'admin/dialogs/UnsavedChangesDialog',
  component: UnsavedChangesDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Confirmation shown by `FormNavigationGuard` when a route change would discard an ' +
          'unsaved form. Built on the design `ConfirmDialog` (itself on `CustomDialog`) instead of ' +
          'a bare MUI `Dialog`. `onStay` keeps editing — also the backdrop/escape action — and ' +
          '`onDiscard` proceeds with the navigation.',
      },
      // `render` returns the local `UnsavedChangesDialogDemo` helper — "Show code" would otherwise
      // show that helper's tag, so this overrides it with the real usage (the dialog owns its own
      // state-free content; the caller only ever supplies `open`/`onStay`/`onDiscard`).
      source: {
        code: `<UnsavedChangesDialog
  open={open}
  onStay={() => setOpen(false)}
  onDiscard={() => navigate()}
/>`,
      },
    },
    controls: {include: []},
  },
  decorators: [withDialogShell],
};

export default meta;

type Story = StoryObj<typeof UnsavedChangesDialog>;

// Top-level component (never an inline arrow) so Storybook's "Show code" serializer, which
// re-invokes `render` outside the story's providers, never trips over a hook read outside context.
const UnsavedChangesDialogDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={'contained'} onClick={() => setOpen(true)}>
        Leave page with unsaved changes
      </Button>
      <UnsavedChangesDialog
        open={open}
        onStay={() => setOpen(false)}
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
  render: (_args) => <UnsavedChangesDialogDemo />,
};
