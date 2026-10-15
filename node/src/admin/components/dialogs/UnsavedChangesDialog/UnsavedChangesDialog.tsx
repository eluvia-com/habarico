import React from 'react';
import {useTranslate} from 'react-admin';
import {ConfirmDialog} from '@design/organisms/ConfirmDialog';

export type UnsavedChangesDialogProps = {
  open: boolean;
  onDiscard: () => void;
  onStay: () => void;
};

export const UnsavedChangesDialog = ({open, onDiscard, onStay}: UnsavedChangesDialogProps) => {
  const translate = useTranslate();

  return (
    <ConfirmDialog
      open={open}
      onCancel={onStay}
      onConfirm={onDiscard}
      title={translate('ra.unsaved_changes.title')}
      content={translate('ra.unsaved_changes.message')}
      cancelLabel={translate('ra.unsaved_changes.stay')}
      confirmLabel={translate('ra.unsaved_changes.discard')}
      confirmColor={'error'}
    />
  );
};
