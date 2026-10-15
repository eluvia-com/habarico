import React, {useState} from 'react';
import {Button} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {withAuthDialogShell} from '../_storyKit';
import {UpdateIdentityDialog} from './UpdateIdentityDialog';

const meta: Meta<typeof UpdateIdentityDialog> = {
  title: 'admin/auth/UpdateIdentityDialog',
  component: UpdateIdentityDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The account-menu "update identity" dialog `AdminDashboardLayout` opens from the ' +
          '`updateIdentity` slot — shown here seeded from the fake signed-in identity. It is a ' +
          'self-contained dialog: built on `CustomDialog` + `CustomDialogTitle`, it owns its own ' +
          'form and renders the Save button directly in the `DialogActions` footer. The layout ' +
          'owns the open state and injects `open` / `onClose`; a successful submit calls `onClose`. ' +
          'Overriding the slot replaces the whole dialog, not just its form.',
      },
    },
    controls: {include: []},
  },
  decorators: [withAuthDialogShell],
};

export default meta;

type Story = StoryObj<typeof UpdateIdentityDialog>;

// `render` returns the local `UpdateIdentityDialogDemo` helper — "Show code" would otherwise show
// that helper's tag, so this overrides it with the real usage (the dialog owns its own state-free
// content; the caller only ever supplies `open`/`onClose`).
const PLAYGROUND_SOURCE = `<UpdateIdentityDialog open={open} onClose={() => setOpen(false)} />`;

// Top-level component (never an inline arrow) so Storybook's "Show code" serializer, which
// re-invokes `render` outside the story's providers, never trips over a hook read outside context.
const UpdateIdentityDialogDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={'contained'} onClick={() => setOpen(true)}>
        Update identity
      </Button>
      <UpdateIdentityDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

/** Click the button to open it; the form submits against a mocked `updateIdentity` call. */
export const Default: Story = {
  parameters: {docs: {source: {code: PLAYGROUND_SOURCE}}},
  // `_args` keeps `render` non-zero-arity — a zero-arity `render` makes Storybook skip
  // `controls.include` filtering entirely (falls back to the full inferred table).
  render: (_args) => <UpdateIdentityDialogDemo />,
};
