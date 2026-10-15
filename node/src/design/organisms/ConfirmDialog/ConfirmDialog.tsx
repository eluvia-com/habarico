import React, {useId} from 'react';
import {Button, DialogActions, DialogContent, DialogContentText} from '@mui/material';
import {LoadingButton} from '../../atoms/LoadingButton';
import {CustomDialog} from '../../molecules/CustomDialog';
import {CustomDialogTitle} from '../../molecules/CustomDialogTitle';
import type {ColorType} from '../../theme/core';

export type ConfirmDialogProps = {
  /** Whether the dialog is visible. The caller (or the `useConfirm` hook) owns this state. */
  open: boolean;
  /** Dialog heading, rendered by `CustomDialogTitle`. */
  title: React.ReactNode;
  /** Body prompt, rendered as muted `DialogContentText`. */
  content: React.ReactNode;
  /** Invoked when the confirm button is pressed. */
  onConfirm: () => void;
  /** Invoked on cancel / backdrop / escape (suppressed while `loading`). */
  onCancel: () => void;
  /** Confirm button label. Defaults to the English `'Confirm'` — translate at the call site. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to the English `'Cancel'` — translate at the call site. */
  cancelLabel?: string;
  /** Shows a spinner on the confirm button and locks the dialog (no cancel/dismiss) while pending. */
  loading?: boolean;
  /** Semantic color of the confirm button. Defaults to `'primary'`. */
  confirmColor?: ColorType;
};

/**
 * A schema-agnostic, React-Admin-free confirmation dialog built on `CustomDialog` +
 * `CustomDialogTitle` and the design `Button` / `LoadingButton`. Purely presentational and
 * controlled — it takes already-resolved strings (English defaults for the button labels) and never
 * translates; translation is the caller's job (see the admin `ActionButton` and the schema
 * `SchemaActionTrigger`). The `loading` flag replicates React Admin's `Confirm` async state: a
 * spinner on the confirm button plus a locked dialog until the pending action resolves.
 */
export const ConfirmDialog = ({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  confirmColor = 'primary',
}: ConfirmDialogProps) => {
  const titleId = useId();
  const contentId = useId();

  return (
    <CustomDialog
      open={open}
      onClose={onCancel}
      disableClose={loading}
      maxWidth={'xs'}
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={contentId}
    >
      <CustomDialogTitle title={<span id={titleId}>{title}</span>} />
      <DialogContent>
        <DialogContentText id={contentId}>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color={'inherit'} onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <LoadingButton
          variant={'contained'}
          color={confirmColor}
          onClick={onConfirm}
          loading={loading}
          autoFocus
        >
          {confirmLabel}
        </LoadingButton>
      </DialogActions>
    </CustomDialog>
  );
};
