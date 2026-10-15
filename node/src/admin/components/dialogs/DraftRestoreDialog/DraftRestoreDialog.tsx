import React from 'react';
import {useTranslate} from 'react-admin';
import {ConfirmDialog} from '@design/organisms/ConfirmDialog';

export type DraftRestoreDialogProps = {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
};

export const DraftRestoreDialog = ({open, onRestore, onDiscard}: DraftRestoreDialogProps) => {
  const translate = useTranslate();

  return (
    <ConfirmDialog
      open={open}
      onCancel={onDiscard}
      onConfirm={onRestore}
      title={translate('ra.draft.title')}
      content={translate('ra.draft.message')}
      cancelLabel={translate('ra.draft.discard')}
      confirmLabel={translate('ra.draft.continue')}
    />
  );
};
