import React from 'react';
import {Link} from '@mui/material';
import {useDialog} from '../../hooks/useDialog';
import {HelpComponentType} from '../types';

export type HelpDialogProps = {
  label?: string;
  Component?: HelpComponentType;
};

/**
 * Header "help" affordance shared by the Auth / Simple shells: a link that opens a
 * dialog with the provided help content. Enabled via the `help` slot.
 */
export function HelpDialog({label = 'Need help?', Component}: HelpDialogProps) {
  const {Dialog, openDialog} = useDialog();

  return (
    <>
      <Link
        onClick={() => openDialog()}
        color="inherit"
        sx={{typography: 'subtitle2', cursor: 'pointer'}}
      >
        {label}
      </Link>
      <Dialog maxWidth="md">{Component && <Component />}</Dialog>
    </>
  );
}
